import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  updateProfile 
} from '@angular/fire/auth';

interface LoginState {
  isLogin: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  loading: boolean;
  errorMessage: string;
}

const initialState: LoginState = {
  isLogin: true,
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  loading: false,
  errorMessage: ''
};

export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  
  withComputed((store) => ({
    
    passwordsMatch: computed(() => 
      store.password() === store.confirmPassword()
    ),
    
    isFormValid: computed(() => {
      const emailValid = store.email().trim() !== '' && store.email().includes('@');
      const passwordValid = store.password().trim().length >= 6;
      
      if (store.isLogin()) {
        return emailValid && passwordValid;
      } else {
        const nameValid = store.name().trim() !== '';
        const passwordsMatch = store.password() === store.confirmPassword();
        return emailValid && passwordValid && nameValid && passwordsMatch;
      }
    }),
    
    buttonText: computed(() => {
      if (store.loading()) return 'LOADING...';
      return store.isLogin() ? 'LOGIN' : 'CREATE ACCOUNT';
    }),
    
    titleText: computed(() => 
      store.isLogin() ? 'WELCOME BACK' : 'JOIN FITTRACK'
    ),
    
    subtitleText: computed(() => 
      store.isLogin() 
        ? 'Login to continue your fitness journey' 
        : 'Start your fitness transformation today'
    ),
    
    toggleText: computed(() => 
      store.isLogin() ? 'Sign up' : 'Login'
    ),
    
    toggleQuestion: computed(() => 
      store.isLogin() ? "Don't have an account?" : 'Already have an account?'
    )
  })),
  
  withMethods((store, auth = inject(Auth), router = inject(Router)) => ({
   
    setEmail(email: string) {
      patchState(store, { email });
    },
    
    setPassword(password: string) {
      patchState(store, { password });
    },
    
    setConfirmPassword(confirmPassword: string) {
      patchState(store, { confirmPassword });
    },
    
    setName(name: string) {
      patchState(store, { name });
    },
    
    
    toggleMode() {
      patchState(store, { 
        isLogin: !store.isLogin(),
        errorMessage: '',
        password: '',
        confirmPassword: '',
        name: ''
      });
    },
    
    
    clearError() {
      patchState(store, { errorMessage: '' });
    },
    
    
    async handleSubmit(event: Event) {
      event.preventDefault();
      
      if (!store.isFormValid()) {
        patchState(store, { 
          errorMessage: 'Please fill in all fields correctly' 
        });
        return;
      }
      
      patchState(store, { loading: true, errorMessage: '' });
      
      try {
        if (store.isLogin()) {
          
          await signInWithEmailAndPassword(auth, store.email(), store.password());
          router.navigate(['/dashboard']);
        } else {
          
          if (!store.passwordsMatch()) {
            patchState(store, { 
              errorMessage: 'Passwords do not match',
              loading: false 
            });
            return;
          }
          
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            store.email(),
            store.password()
          );
          
          await updateProfile(userCredential.user, {
            displayName: store.name()
          });
          
          router.navigate(['/dashboard']);
        }
      } catch (error: any) {
        patchState(store, { 
          errorMessage: error.message || 'Authentication failed' 
        });
      } finally {
        patchState(store, { loading: false });
      }
    },
    
    
    async handleGoogleAuth() {
      patchState(store, { loading: true, errorMessage: '' });
      
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.navigate(['/dashboard']);
      } catch (error: any) {
        patchState(store, { 
          errorMessage: error.message || 'Google authentication failed' 
        });
      } finally {
        patchState(store, { loading: false });
      }
    },
    
    
    async handleFacebookAuth() {
      patchState(store, { loading: true, errorMessage: '' });
      
      try {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(auth, provider);
        router.navigate(['/dashboard']);
      } catch (error: any) {
        patchState(store, { 
          errorMessage: error.message || 'Facebook authentication failed' 
        });
      } finally {
        patchState(store, { loading: false });
      }
    },
    
    
    resetForm() {
      patchState(store, {
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        errorMessage: '',
        loading: false
      });
    }
  }))
);
