import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Placeholder authentication service.
 *
 * @deprecated This service is a stub and should be replaced with a proper
 * authentication implementation before adding auth-dependent features.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly http: HttpClient) {}
}
