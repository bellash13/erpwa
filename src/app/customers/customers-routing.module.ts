import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { AuthGuard } from '../shared/guards/auth.guard';
import { CustomersListComponent } from './customers-list/customers-list.component';

const routes: Routes =  [
  { path: 'login', component: LoginComponent },
  { path: 'customers', component: CustomersListComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
