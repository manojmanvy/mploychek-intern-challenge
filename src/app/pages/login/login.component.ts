import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
selector: 'app-login',
templateUrl: './login.component.html',
styleUrls: ['./login.component.css']
})
export class LoginComponent {
userId: string = '';
password: string = '';
role: string = 'user';

loading: boolean = false;
errorMessage: string = '';
showPassword: boolean = false;

constructor(
private authService: AuthService,
private router: Router
) { }

onSubmit(form: NgForm): void {
if (form.invalid || this.loading) {
return;
}


this.loading = true;
this.errorMessage = '';

this.authService.login(
  this.userId,
  this.password,
  this.role
).subscribe(
  (response) => {
    this.loading = false;

    if (response.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = response.message;
    }
  },
  (error) => {
    this.loading = false;

    if (error.status === 401) {
      this.errorMessage = 'Invalid User ID, password, or role.';
    } else if (error.status === 0) {
      this.errorMessage = 'Cannot connect to server. Please try again.';
    } else {
      this.errorMessage =
        error.error?.message || 'Login failed. Please try again.';
    }
  }
);


}
}
