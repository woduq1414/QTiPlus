import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import fg from 'fast-glob';
import { AsyncZipDeflate, Zip } from 'fflate';
// Converts bytes to megabytes
function toMB(bytes) {
  return bytes / 1024 / 1024;
}
// Creates the build directory if it doesn't exist
function ensureBuildDirectoryExists(buildDirectory) {
  if (!existsSync(buildDirectory)) {
    mkdirSync(buildDirectory, { recursive: true });
  }
}
// Logs the package size and duration
function logPackageSize(size, startTime) {
  console.log(`Zip Package size: ${toMB(size).toFixed(2)} MB in ${Date.now() - startTime}ms`);
}
// Handles file streaming and zipping
function streamFileToZip(absPath, relPath, zip, onAbort, onError) {
  const data = new AsyncZipDeflate(relPath, { level: 9 });
  zip.add(data);
  createReadStream(absPath)
    .on('data', chunk => (typeof chunk === 'string' ? data.push(Buffer.from(chunk), false) : data.push(chunk, false)))
    .on('end', () => data.push(new Uint8Array(0), true))
    .on('error', error => {
      onAbort();
      onError(error);
    });
}
// Zips the bundle
export const zipBundle = async ({ distDirectory, buildDirectory, archiveName }, withMaps = false) => {
  ensureBuildDirectoryExists(buildDirectory);
  const zipFilePath = resolve(buildDirectory, archiveName);
  const output = createWriteStream(zipFilePath);
  const fileList = await fg(
    [
      '**/*', // Pick all nested files
      ...(!withMaps ? ['!**/(*.js.map|*.css.map)'] : []), // Exclude source maps conditionally
    ],
    {
      cwd: distDirectory,
      onlyFiles: true,
    },
  );
  return new Promise((pResolve, pReject) => {
    let aborted = false;
    let totalSize = 0;
    const timer = Date.now();
    const zip = new Zip((err, data, final) => {
      if (err) {
        pReject(err);
      } else {
        totalSize += data.length;
        output.write(data);
        if (final) {
          logPackageSize(totalSize, timer);
          output.end();
          pResolve();
        }
      }
    });
    // Handle file read streams
    for (const file of fileList) {
      if (aborted) return;
      const absPath = resolve(distDirectory, file);
      const absPosixPath = posix.resolve(distDirectory, file);
      const relPosixPath = posix.relative(distDirectory, absPosixPath);
      console.log(`Adding file: ${relPosixPath}`);
      streamFileToZip(
        absPath,
        relPosixPath,
        zip,
        () => {
          aborted = true;
          zip.terminate();
        },
        error => pReject(`Error reading file ${absPath}: ${error.message}`),
      );
    }
    zip.end();
  });
};
