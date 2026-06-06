import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  async get<T>(url: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<T>>(url, { params: this.toHttpParams(params) })
      );
      return res.data;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async post<T, TPayload = unknown>(url: string, payload: TPayload): Promise<T> {
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<T>>(url, payload));
      return res.data;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async put<T, TPayload = unknown>(url: string, payload: TPayload): Promise<T> {
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<T>>(url, payload));
      return res.data;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const res = await firstValueFrom(this.http.delete<ApiResponse<T>>(url));
      return res.data;
    } catch (error) {
      throw this.toError(error);
    }
  }

  private toHttpParams(params?: Record<string, string | number | boolean | null | undefined>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error?.message === 'string'
        ? error.error.message
        : 'Khong the ket noi API.';
      return new Error(message);
    }

    return error instanceof Error ? error : new Error('Khong the ket noi API.');
  }
}
