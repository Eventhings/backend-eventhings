export function base64MimeType(encoded: any): string {
	var result = null;

	if (typeof encoded !== "string") {
		return result ?? "";
	}

	var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

	if (mime && mime.length) {
		result = mime[1];
	}

	return result ?? "";
}
