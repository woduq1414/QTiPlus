export const ManifestParserImpl = {
  convertManifestToString: (manifest, isFirefox) => {
    if (isFirefox) {
      manifest = convertToFirefoxCompatibleManifest(manifest);
    }
    return JSON.stringify(manifest, null, 2);
  },
};
const convertToFirefoxCompatibleManifest = manifest => {
  const manifestCopy = {
    ...manifest,
  };
  if (manifest.background?.service_worker) {
    manifestCopy.background = {
      scripts: [manifest.background.service_worker],
      type: 'module',
    };
  }
  if (manifest.options_page) {
    manifestCopy.options_ui = {
      page: manifest.options_page,
      browser_style: false,
    };
  }
  manifestCopy.content_security_policy = {
    extension_pages: "script-src 'self'; object-src 'self'",
  };
  manifestCopy.permissions = manifestCopy.permissions.filter(value => value !== 'sidePanel');
  delete manifestCopy.options_page;
  delete manifestCopy.side_panel;
  return manifestCopy;
};
