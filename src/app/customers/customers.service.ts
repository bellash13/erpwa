import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { Customer } from './models/customer.model';
import { AuthService } from '../shared/services/auth.service';
import { EncryptDataService } from '../shared/services/encrypt-data.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends EncryptDataService<Customer> {
  private apiUrl = 'https://localhost:5001/customers'; // Replace with your API URL

  constructor(authService: AuthService, private http: HttpClient) {
    super(authService);
  }

  async addCustomer(customer: Customer): Promise<void> {
    customer.id = Date.now().toString(); // Temporary local ID
    customer.syncStatus = 'created';
    customer.isTempId = true;
    await this.saveItem(customer.id, customer);
    this.syncData(); // Attempt to sync after local operation
  }

  async updateCustomer(customer: Customer): Promise<void> {
    customer.syncStatus = 'updated';
    await this.saveItem(customer.id, customer);
    this.syncData(); // Attempt to sync after local operation
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.getCustomer(id);
    if (customer) {
      if (customer.isTempId) {
        await this.removeItem(id); // Remove local data immediately for temp IDs
      } else {
        customer.syncStatus = 'deleted';
        await this.saveItem(id, customer);
      }
    }
    this.syncData(); // Attempt to sync after local operation
  }

  async getCustomer(id: string): Promise<Customer | null> {
    return await this.getItem(id); // Always read locally first
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await this.getAllItems(); // Always read locally first
  }

  async syncData(): Promise<void> {
    if (navigator.onLine && this.authService.isLoggedInOnline()) {
      const customers = await this.getAllCustomers();

      const createdCustomers = customers.filter(
        (c) => c.syncStatus === 'created'
      );
      const updatedCustomers = customers.filter(
        (c) => c.syncStatus === 'updated'
      );
      const deletedCustomers = customers.filter(
        (c) => c.syncStatus === 'deleted'
      );

      // Sync Created Customers
      for (const customer of createdCustomers) {
        const serverResponse = await this.createCustomerOnServer(customer);
        if (serverResponse?.id) {
          await this.removeItem(customer.id); // Remove old record with temp ID
          customer.id = serverResponse.id;
          customer.syncStatus = undefined; // Clear sync status
          customer.isTempId = false;
          await this.saveItem(customer.id, customer);
        }
      }

      // Sync Updated Customers
      for (const customer of updatedCustomers) {
        await this.updateCustomerOnServer(customer);
        customer.syncStatus = undefined; // Clear sync status
        await this.saveItem(customer.id, customer);
      }

      // Sync Deleted Customers
      for (const customer of deletedCustomers) {
        await this.deleteCustomerOnServer(customer.id);
        await this.removeItem(customer.id);
      }
    }
  }

  async clearLocalData(): Promise<void> {
    await localforage.clear();
  }

  async createCustomerOnServer(customer: Customer): Promise<Customer | null> {
    try {
      const response = await this.http
        .post<Customer>(`${this.apiUrl}`, customer)
        .toPromise();
      return response ?? null;
    } catch (error) {
      console.error('Failed to create customer on server', error);
      return null;
    }
  }

  async updateCustomerOnServer(customer: Customer): Promise<void> {
    try {
      await this.http
        .put(`${this.apiUrl}/${customer.id}`, customer)
        .toPromise();
    } catch (error) {
      console.error('Failed to update customer on server', error);
    }
  }

  async deleteCustomerOnServer(id: string): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/${id}`).toPromise();
    } catch (error) {
      console.error('Failed to delete customer on server', error);
    }
  }

  async replaceLocalCustomerWithServer(
    localId: string,
    serverCustomer: Customer
  ): Promise<void> {
    await this.removeCustomerFromLocal(localId);
    await this.saveCustomerLocally(serverCustomer);
  }

  async clearSyncStatus(id: string): Promise<void> {
    const customer = await this.getCustomerById(id);
    if (customer) {
      customer.syncStatus = undefined;
      await this.saveCustomerLocally(customer);
    }
  }

  async removeCustomerFromLocal(id: string): Promise<void> {
    await localforage.removeItem(id);
  }

  async fetchAndSyncServerData(): Promise<void> {
    try {
      const serverCustomers =
        (await this.http.get<Customer[]>(`${this.apiUrl}`).toPromise()) || [];

      for (const serverCustomer of serverCustomers) {
        await this.saveCustomerLocally(serverCustomer);
      }
    } catch (error) {
      console.error('Failed to fetch and sync server data', error);
    }
  }

  private async saveCustomerLocally(customer: Customer): Promise<void> {
    await localforage.setItem(customer.id, JSON.stringify(customer));
  }

  private async getCustomerById(id: string): Promise<Customer | null> {
    const customerData = await localforage.getItem(id);
    return customerData ? JSON.parse(customerData as string) : null;
  }
}
