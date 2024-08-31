import { Component, OnInit } from '@angular/core';
import { Customer } from '../models/customer.model';
import { CustomerService } from '../customers.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomersEditComponent } from '../customers-edit/customers-edit.component';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.scss',
})
export class CustomersListComponent implements OnInit {
  customers: Customer[] = [];

  constructor(
    private customerService: CustomerService,
    private modalService: NgbModal
  ) {}

  async ngOnInit() {
    this.customers = await this.customerService.getAllCustomers();
  }

  async deleteCustomer(id: string) {
    await this.customerService.deleteCustomer(id);
    this.customers = await this.customerService.getAllCustomers();
  }

  async clearLocalData() {
    await this.customerService.clearLocalData();
    this.customers = [];
  }

  openEditDialog(customer?: Customer) {
    const modalRef = this.modalService.open(CustomersEditComponent, {
      size: 'lg',
    });
    modalRef.componentInstance.customer = customer
      ? { ...customer }
      : { id: '', name: '', email: '' };

    modalRef.result.then(
      async (result) => {
        if (result) {
          if (result.id) {
            await this.customerService.updateCustomer(result);
          } else {
            await this.customerService.addCustomer(result);
          }
          this.customers = await this.customerService.getAllCustomers();
        }
      },
      () => {
        // Handle dismissal without saving
      }
    );
  }
}
