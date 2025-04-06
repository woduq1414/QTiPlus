// IT WILL BE ADJUSTED TO YOUR LANGUAGE DURING BUILD TIME, DON'T MOVE BELOW IMPORT TO OTHER LINE
import localeJSON from '../locales/ko/messages.json' with { type: 'json' };
const translate = (key, substitutions) => {
  const localeValues = localeJSON[key];
  let message = localeValues.message;
  /**
   * This is a placeholder replacement logic. But it's not perfect.
   * It just imitates the behavior of the Chrome extension i18n API.
   * Please check the official document for more information And double-check the behavior on production build.
   *
   * @url https://developer.chrome.com/docs/extensions/how-to/ui/localization-message-formats#placeholders
   */
  if (localeValues.placeholders) {
    Object.entries(localeValues.placeholders).forEach(([key, { content }]) => {
      if (content) {
        message = message.replace(new RegExp(`\\$${key}\\$`, 'gi'), content);
      }
    });
  }
  if (!substitutions) {
    return message;
  } else if (Array.isArray(substitutions)) {
    return substitutions.reduce((acc, cur, idx) => acc.replace(`$${idx++}`, cur), message);
  }
  return message.replace(/\$(\d+)/, substitutions);
};
const removePlaceholder = message => message.replace(/\$\d+/g, '');
export const t = (...args) => removePlaceholder(translate(...args));
