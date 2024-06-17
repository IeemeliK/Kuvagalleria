type imageData = {
	_id: string;
	imageName: string;
	imageText: string;
	imageKey: string;
	imageUrl: string;
	urlExpiresIn: number;
};

export interface album {
	_id: string;
	name: string;
	coverPhoto: string;
	images: imageData[];
}
