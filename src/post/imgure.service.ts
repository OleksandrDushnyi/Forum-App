import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class ImgurService {
  private clientUrl = process.env.IMGUR_CLIENT_URL;
  private clientId = process.env.IMGUR_CLIENT_ID;

  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageBuffer.toString('base64'));

    try {
      const response = await axios.post(`${this.clientUrl}/3/image`, formData, {
        headers: {
          Authorization: `Client-ID ${this.clientId}`,
          ...formData.getHeaders(),
        },
      });
      return response.data.data.link;
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload image to Imgur');
    }
  }

  async deleteImage(imageDeleteHash: string): Promise<void> {
    try {
      await axios.delete(`${this.clientUrl}/3/image/${imageDeleteHash}`, {
        headers: {
          Authorization: `Client-ID ${this.clientId}`,
        },
      });
    } catch (error) {
      console.error(
        'Imgur delete image error:',
        error.response || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to delete image from Imgur',
      );
    }
  }

  extractImageDeleteHash(imageUrl: string): string {
    return imageUrl.split('/').pop();
  }
}
