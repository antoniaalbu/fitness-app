
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, updateProfile } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  isLogin = signal(true);
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  name = signal('');
  loading = signal(false);
  errorMessage = signal('');

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    this.errorMessage.set('');
  }

  async handleSubmit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      if (this.isLogin()) {
        await signInWithEmailAndPassword(this.auth, this.email(), this.password());
        this.router.navigate(['/dashboard']);
      } else {
        if (this.password() !== this.confirmPassword()) {
          this.errorMessage.set('Passwords do not match');
          this.loading.set(false);
          return;
        }

        
        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          this.email(),
          this.password()
        );

        
        await updateProfile(userCredential.user, {
          displayName: this.name()
        });

        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Authentication failed');
    } finally {
      this.loading.set(false);
    }
  }

  async handleGoogleAuth() {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Google authentication failed');
    } finally {
      this.loading.set(false);
    }
  }

  async handleFacebookAuth() {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Facebook authentication failed');
    } finally {
      this.loading.set(false);
    }
  }
}
