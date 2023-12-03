import { Storage } from "@google-cloud/storage";
import { env } from "process";

const bucketCredentials = {
	type: "service_account",
	project_id: env.GCLOUD_PROJECT_ID,
	private_key_id: env.GCLOUD_PRIVATE_KEY_ID,
	private_key: env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
	client_email: env.GCLOUD_CLIENT_EMAIL,
	client_id: env.GCLOUD_CLIENT_ID,
	auth_uri: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url: env.GCLOUD_CLIENT_CERT_URL,
	universe_domain: "googleapis.com",
};

export const storage = new Storage({ credentials: bucketCredentials });

export const uploadFile = async ({
	fileName,
	base64,
	isPublic,
	folderName,
}: {
	fileName: string;
	base64: string;
	isPublic: boolean;
	folderName?: string;
}) => {
	const fileBuffer = Buffer.from(base64, "base64");

	const uploadOptions = {
		destination: folderName ? `${folderName}/${fileName}` : `${fileName}`,
		public: isPublic,
		metadata: {
			contentType: "image/jpeg",
			predefinedAcl: isPublic ? "publicRead" : "private",
		},
	};
	console.log(uploadOptions);

	try {
		const bucket = storage.bucket(env.GCLOUD_BUCKET_NAME ?? "");
		const file = bucket.file(
			folderName ? `${folderName}/${fileName}` : `${fileName}`
		);

		const stream = file.createWriteStream(uploadOptions);

		stream.end(fileBuffer);

		await new Promise((resolve, reject) => {
			stream.on("finish", resolve);
			stream.on("error", reject);
		});

		const publicUrl = `https://storage.googleapis.com/${
			env.GCLOUD_BUCKET_NAME
		}/${folderName ? `${folderName}/${fileName}` : `${fileName}`}`;
		console.log(
			`File ${fileName}.jpg uploaded to folder ${folderName} in ${env.GCLOUD_BUCKET_NAME}.`
		);

		return publicUrl;
	} catch (err) {
		console.error("Error uploading file:", err);
		throw err;
	}
};
