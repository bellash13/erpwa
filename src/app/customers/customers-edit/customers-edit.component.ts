import { Component, Input, OnInit } from '@angular/core';
import { Customer } from '../models/customer.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-customers-edit',
  templateUrl: './customers-edit.component.html',
  styleUrl: './customers-edit.component.scss'
})
export class CustomersEditComponent implements OnInit {
  @Input() customer: Customer = { id: '', name: '', email: '' };
  customerForm: FormGroup;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.customerForm.patchValue({
      name: this.customer.name,
      email: this.customer.email
    });
  }

  save() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
      this.customer.name = formValue.name;
      this.customer.email = formValue.email;
      this.activeModal.close(this.customer);
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }
}