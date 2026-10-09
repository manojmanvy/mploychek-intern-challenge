import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProfile(delayMs: number = 1500): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/profile?delayMs=${delayMs}`,
      { headers: this.getHeaders() }
    );
  }

  getRecords(delayMs: number = 1500): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/records?delayMs=${delayMs}`,
      { headers: this.getHeaders() }
    );
  }

  getUsers(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/users`,
      { headers: this.getHeaders() }
    );
  }

  createUser(user: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/users`,
      user,
      { headers: this.getHeaders() }
    );
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${id}`,
      user,
      { headers: this.getHeaders() }
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}`,
      { headers: this.getHeaders() }
    );
  }
}