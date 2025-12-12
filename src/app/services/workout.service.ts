import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  unit: string; 
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private get uid() {
    return this.auth.currentUser?.uid;
  }

  private getWorkoutsDocRef() {
    if (!this.uid) {
      throw new Error('User not authenticated');
    }
    return doc(this.firestore, `users/${this.uid}/workouts/list`);
  }

  /**
   * Load all workouts from Firestore
   */
  async loadWorkouts(): Promise<Workout[]> {
    try {
      const docRef = this.getWorkoutsDocRef();
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data?.['data'] || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading workouts:', error);
      throw error;
    }
  }

  /**
   * Save all workouts to Firestore
   */
  async saveWorkouts(workouts: Workout[]): Promise<void> {
    try {
      const docRef = this.getWorkoutsDocRef();
      await setDoc(docRef, { data: workouts }, { merge: true });
      console.log('💾 Workouts saved to Firestore');
    } catch (error) {
      console.error('Error saving workouts:', error);
      throw error;
    }
  }

  /**
   * Create initial workout data
   */
  async createInitialWorkouts(): Promise<Workout[]> {
    const timestamp = Date.now();
    const workouts: Workout[] = [
      {
        id: `lower-${timestamp}`,
        name: 'Lower Body',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          {
            id: `${timestamp}-1`,
            name: 'Step ups',
            sets: [
              { reps: 12, weight: 15 },
              { reps: 10, weight: 18 },
              { reps: 8, weight: 20 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-2`,
            name: 'Kickbacks',
            sets: [
              { reps: 15, weight: 40 },
              { reps: 13, weight: 45 },
              { reps: 11, weight: 50 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-3`,
            name: 'Indreptari',
            sets: [
              { reps: 12, weight: 5 },
              { reps: 12, weight: 5 },
              { reps: 9, weight: 7.5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-4`,
            name: 'Aductii',
            sets: [
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-5`,
            name: 'Extensii quads',
            sets: [
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 }
            ],
            unit: 'kg',
            notes: 'Weight not specified'
          }
        ]
      },
      {
        id: `upper-${timestamp}`,
        name: 'Upper Body',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          {
            id: `${timestamp}-6`,
            name: 'Ramat',
            sets: [
              { reps: 13, weight: 19 },
              { reps: 11, weight: 21 },
              { reps: 11, weight: 21 },
              { reps: 9, weight: 24 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-7`,
            name: 'Tractiuni',
            sets: [
              { reps: 13, weight: 24 },
              { reps: 9, weight: 27 },
              { reps: 9, weight: 27 },
              { reps: 7, weight: 29 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-8`,
            name: 'Face pull',
            sets: [
              { reps: 13, weight: 20 },
              { reps: 13, weight: 20 },
              { reps: 9, weight: 25 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-9`,
            name: 'Arnold press',
            sets: [
              { reps: 13, weight: 3 },
              { reps: 13, weight: 3 },
              { reps: 9, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-10`,
            name: 'Triceps',
            sets: [
              { reps: 13, weight: 10 },
              { reps: 13, weight: 10 },
              { reps: 11, weight: 15 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-11`,
            name: 'Biceps',
            sets: [
              { reps: 12, weight: 3 },
              { reps: 12, weight: 3 },
              { reps: 8, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-12`,
            name: 'Ridicari laterale',
            sets: [
              { reps: 13, weight: 3 },
              { reps: 13, weight: 3 },
              { reps: 9, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-13`,
            name: 'Lombar',
            sets: [
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 }
            ],
            unit: 'kg',
            notes: 'Fara greutate'
          }
        ]
      }
    ];

    await this.saveWorkouts(workouts);
    return workouts;
  }

  /**
   * Add a new workout
   */
  async addWorkout(workouts: Workout[], name: string): Promise<Workout[]> {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString().split('T')[0],
      exercises: []
    };

    const updatedWorkouts = [...workouts, newWorkout];
    await this.saveWorkouts(updatedWorkouts);
    return updatedWorkouts;
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(workouts: Workout[], workoutId: string): Promise<Workout[]> {
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    await this.saveWorkouts(updatedWorkouts);
    return updatedWorkouts;
  }
}