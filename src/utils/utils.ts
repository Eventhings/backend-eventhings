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

export const partiallyObscureEmail = (email: string) => {
	const atIndex = email.indexOf("@");
	if (atIndex > 0) {
		const beforeAt = email.substring(0, atIndex);
		const obscuredPart =
			beforeAt[0] +
			"*".repeat(beforeAt.length - 2) +
			beforeAt[beforeAt.length - 1];
		const partialEmail = obscuredPart + email.substring(atIndex);
		return partialEmail;
	}
	return email;
};
