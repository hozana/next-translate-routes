/**
 * A segment can be ignored by setting its path to "." in _routes.json.
 * It can be done for some lang only and not others.
 *
 * It can cause troubles with the redirections. Ex:
 * Given the /a/[b]/[c] and /a/[b]/[c]/d file paths. [b] is ignored and the b param is merged with the c param: ":b-:c".
 * Then /a/b/c will be redirected to /a/b-c and that is fine.
 * But /a/b-c/d will be redirected to /a/b-c-d and that is not fine.
 *
 * To handle this case, one can add a path-to-regex pattern to the default ignore token. Ex: '.(\\d+)', or '.(\[\^-\]+)'.
 * This path-to-regex pattern will be added after the segment name in the redirect.
 * Then /a/b(\\d+)/c will be redirected to /a/b-c, and /a/b-c/d will not be redirected to /a/b-c-d.
 * /!\ This is only handled in default paths (i.e. "/": ".(\\d+)" or "/": { "default": ".(\\d+)" }), not in lang-specific paths.
 */
export declare const ignoreSegmentPathRegex: RegExp
