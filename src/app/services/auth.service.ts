import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    userId: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  login(
    userId: string,
    password: string,
    role: string
  ): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { userId, password, role }
    ).pipe(
      map((response: LoginResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem(
          'currentUser',
          JSON.stringify(response.user)
        );

        return response;
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): LoginResponse['user'] | null {
    const user = localStorage.getItem('currentUser');

    return user ? JSON.parse(user) : null;
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    ).pipe(
      map((response: { success: boolean; message: string }) => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');

        return response;
      })
    );
  }
}