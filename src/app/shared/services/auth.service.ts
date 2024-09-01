import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import localforage from 'localforage';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private localUser: User | null = null;
  private onlineUser: User | null = null;
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);
  private apiUrl = 'https://localhost:5001/auth'; // Set your actual API URL

  constructor(private router: Router, private http: HttpClient) {
    this.localUser = null;
    this.onlineUser = null;

    // Subscribe to online event
    this.online$.subscribe(async (isOnline) => {
      if (isOnline && this.localUser) {
        await this.syncDataOnOnline();
      }
    });

    // Listen for online/offline changes
    window.addEventListener('online', () => this.online$.next(true));
    window.addEventListener('offline', () => this.online$.next(false));
  }

  private encryptData(data: any, key: string): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  }

  private decryptData(data: string, key: string): any {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async loginLocally(username: string, password: string): Promise<boolean> {
    const users: any = await localforage.getItem('users');
    if (users) {
      const encryptedUser = users[username];
      if (encryptedUser) {
        const decryptedUser: User = this.decryptData(encryptedUser, password);
        if (decryptedUser.password === CryptoJS.SHA256(password).toString()) {
          this.localUser = decryptedUser;
          localforage.config({
            name: `db_${username}`,
            storeName: `customers`,
          });
          return true;
        }
      }
    }
    return false;
  }

  async loginOnline(username: string, password: string): Promise<boolean> {
    const payload = {
      username,
      password: CryptoJS.SHA256(password).toString(),
    };
    try {
      const response = await this.http
        .post<User>(`${this.apiUrl}/login`, payload)
        .toPromise();
      if (response) {
        this.onlineUser = response;
        return true;
      }
    } catch (error) {
      console.error('Online login failed', error);
    }
    return false;
  }

  async logout(clearData: boolean = false) {
    if (clearData) {
      await this.clearLocalData();
    }
    this.localUser = null;
    this.onlineUser = null;
    this.router.navigate(['/login']);
  }

  isLoggedInLocally(): boolean {
    return !!this.localUser;
  }

  isLoggedInOnline(): boolean {
    return !!this.onlineUser;
  }

  getSecretKey(): string {
    return this.localUser ? this.localUser.secretKey : '';
  }

  async register(username: string, password: string): Promise<boolean> {
    const payload = {
      username,
      passwordHash: CryptoJS.SHA256(password).toString(),
      secretKey: this.generateSecretKey(username),
    };

    try {
      const response = await this.http
        .post<User>(`${this.apiUrl}/register`, payload)
        .toPromise();
      if (response) {
        const users: any = (await localforage.getItem('users')) || {};
        users[username] = this.encryptData(response, password);
        await localforage.setItem('users', users);
        this.router.navigate(['/']);
        return true;
      }
    } catch (error) {
      console.error('Registration failed', error);
    }
    return false;
  }

  private generateSecretKey(username: string): string {
    return `${username}-secret-key`;
  }

  async clearLocalData(): Promise<void> {
    await localforage.clear();
  }

  public async syncDataOnOnline(): Promise<void> {
    if (this.isLoggedInOnline()) {
      await this.syncWithServer();
    } else {
      const loginSuccessful = await this.promptForOnlineLogin();
      if (loginSuccessful) {
        await this.syncWithServer();
      }
    }
  }

  private async promptForOnlineLogin(): Promise<boolean> {
    const username = this.localUser?.username || '';
    const password = prompt('Enter your password for online authentication');
    if (password) {
      return this.loginOnline(username, password);
    }
    return false;
  }

  private async syncWithServer(): Promise<void> {
    try {
    } catch (error) {
      console.error('Failed to sync data with the server', error);
    }
  }
}
