import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: LoginResponse['user'] | null = null;

  records: any[] = [];
  users: any[] = [];

  loading: boolean = true;
  usersLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  showUserForm: boolean = false;

  newUser = {
    userId: '',
    password: '',
    name: '',
    email: '',
    role: 'user'
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.authService.getToken() || !this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getProfile(1500).subscribe(
      (response) => {
        this.currentUser = response.user;

        this.userService.getRecords(1500).subscribe(
          (recordsResponse) => {
            this.records = recordsResponse.records || [];
            this.loading = false;

            if (this.isAdmin()) {
              this.loadUsers();
            }
          },
          (error) => {
            this.loading = false;
            this.handleError(error);
          }
        );
      },
      (error) => {
        this.loading = false;

        if (error.status === 401) {
          this.clearSession();
          this.router.navigate(['/login']);
        } else {
          this.handleError(error);
        }
      }
    );
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  loadUsers(): void {
    this.usersLoading = true;

    this.userService.getUsers().subscribe(
      (response) => {
        this.users = response.users || [];
        this.usersLoading = false;
      },
      (error) => {
        this.usersLoading = false;
        this.handleError(error);
      }
    );
  }

  createUser(): void {
    if (
      !this.newUser.userId.trim() ||
      !this.newUser.password ||
      !this.newUser.name.trim() ||
      !this.newUser.email.trim()
    ) {
      this.errorMessage = 'Please complete all user fields.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.userService.createUser(this.newUser).subscribe(
      (response) => {
        this.successMessage = response.message;
        this.newUser = {
          userId: '',
          password: '',
          name: '',
          email: '',
          role: 'user'
        };
        this.showUserForm = false;
        this.loadUsers();
      },
      (error) => {
        this.handleError(error);
      }
    );
  }

  deleteUser(id: number, userId: string): void {
    const confirmed = confirm(
      'Are you sure you want to delete user ' + userId + '?'
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.userService.deleteUser(id).subscribe(
      (response) => {
        this.successMessage = response.message;
        this.loadUsers();
      },
      (error) => {
        this.handleError(error);
      }
    );
  }

  logout(): void {
    this.authService.logout().subscribe(
      () => {
        this.router.navigate(['/login']);
      },
      () => {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    );
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  private handleError(error: any): void {
    this.errorMessage =
      error.error?.message || 'Something went wrong. Please try again.';
  }
}