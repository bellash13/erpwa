import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import localforage from 'localforage';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EncryptDataService<T> {
  constructor(protected authService: AuthService) {}

  protected encryptData(data: T): string {
    const key = this.authService.getSecretKey();
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  }

  protected decryptData(encryptedData: string): T {
    const key = this.authService.getSecretKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  protected async saveItem(key: string, data: T): Promise<void> {
    const encryptedData = this.encryptData(data);
    await localforage.setItem(key, encryptedData);
  }

  protected async getItem(key: string): Promise<T | null> {
    const encryptedData = await localforage.getItem(key);
    return encryptedData ? this.decryptData(encryptedData as string) : null;
  }

  protected async removeItem(key: string): Promise<void> {
    await localforage.removeItem(key);
  }

  protected async getAllItems(): Promise<T[]> {
    const items: T[] = [];
    await localforage.iterate((value, key) => {
      items.push(this.decryptData(value as string));
    });
    return items;
  }
}
