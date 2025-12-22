import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { UserDataService } from '../services/user-data.service';
import { WorkoutService, Workout, WorkoutHistoryEntry } from '../services/workout.service';
import { ModalComponent } from '../modal/modal.component';

interface WorkoutSet {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface Goal {
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
}

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface ProgressData {
  date: string;
  weight: number;
  workouts: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private userData = inject(UserDataService);
  private workoutService = inject(WorkoutService);

  userName = signal('Loading...');
  userStreak = signal(0);

  todayWorkout = signal<WorkoutSet[]>([]);
  goals = signal<Goal[]>([]);
  mealPlan = signal<Meal[]>([]);
  progressData = signal<ProgressData[]>([]);
  workouts = signal<Workout[]>([]);
  
  // Workout history
  workoutHistory = signal<WorkoutHistoryEntry[]>([]);
  selectedExerciseForHistory = signal<string | null>(null);

  // Modal states
  showGoalModal = signal(false);
  showMealModal = signal(false);
  showWorkoutModal = signal(false);
  showProgressModal = signal(false);

  // Edit states
  editingGoal = signal<Goal | null>(null);
  editingGoalIndex = signal<number | null>(null);
  editingMeal = signal<Meal | null>(null);
  editingMealIndex = signal<number | null>(null);
  editingWorkout = signal<WorkoutSet | null>(null);
  editingWorkoutIndex = signal<number | null>(null);
  editingProgress = signal<ProgressData | null>(null);
  editingProgressIndex = signal<number | null>(null);

  // Form data
  goalForm = signal<Goal>({
    title: '',
    current: 0,
    target: 0,
    unit: 'lbs',
    deadline: ''
  });

  mealForm = signal<Meal>({
    name: '',
    time: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });

  workoutForm = signal<WorkoutSet>({
    exercise: '',
    sets: 0,
    reps: 0,
    weight: 0,
    completed: false
  });

  progressForm = signal<ProgressData>({
    date: '',
    weight: 0,
    workouts: 0
  });

  // Computed values for history
  recentHistory = computed(() => 
    this.workoutHistory().slice(0, 10)
  );

  uniqueExercises = computed(() => {
    const exercises = new Set(this.workoutHistory().map(h => h.exerciseName));
    return Array.from(exercises).sort();
  });

  filteredHistory = computed(() => {
    const selected = this.selectedExerciseForHistory();
    if (!selected) return this.recentHistory();
    return this.workoutHistory()
      .filter(h => h.exerciseName === selected)
      .slice(0, 10);
  });

  historySummary = computed(() => 
    this.workoutService.getRecentWorkoutsSummary(this.workoutHistory(), 7)
  );

  async ngOnInit() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userName.set(user.displayName || user.email || 'User');
        await this.loadAllData();
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }

  async loadAllData() {
    try {
      const workout = await this.userData.getData('workout/today');
      const goals = await this.userData.getData('goals/list');
      const meals = await this.userData.getData('meals/plan');
      const progress = await this.userData.getData('progress/weekly');

      this.todayWorkout.set(workout?.['data'] ?? []);
      this.goals.set(goals?.['data'] ?? []);
      this.mealPlan.set(meals?.['data'] ?? []);
      this.progressData.set(progress?.['data'] ?? []);

      const workouts = await this.workoutService.loadWorkouts();
      this.workouts.set(workouts);

      // Load workout history
      const history = await this.workoutService.loadHistory();
      this.workoutHistory.set(history);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  // Computed values
  totalCalories = computed(() =>
    this.mealPlan().reduce((sum, meal) => sum + meal.calories, 0)
  );

  totalProtein = computed(() =>
    this.mealPlan().reduce((sum, meal) => sum + meal.protein, 0)
  );

  completedSets = computed(() =>
    this.todayWorkout().filter(w => w.completed).length
  );

  totalSets = computed(() =>
    this.todayWorkout().length
  );

  workoutProgress = computed(() =>
    this.totalSets() > 0 ? Math.round((this.completedSets() / this.totalSets()) * 100) : 0
  );

  totalExercises = computed(() =>
    this.workouts().reduce((sum, workout) => sum + workout.exercises.length, 0)
  );

  totalWorkoutSets = computed(() =>
    this.workouts().reduce((sum, workout) => 
      sum + workout.exercises.reduce((exerciseSum, exercise) => 
        exerciseSum + exercise.sets.length, 0
      ), 0
    )
  );

  async toggleWorkoutComplete(index: number) {
    const workouts = this.todayWorkout();
    workouts[index].completed = !workouts[index].completed;
    this.todayWorkout.set([...workouts]);
    await this.userData.updateData('workout/today', { data: workouts });
  }

  getGoalProgress(goal: Goal): number {
    return Math.round((goal.current / goal.target) * 100);
  }

  goToExercises() {
    this.router.navigate(['/exercises']);
  }

  getExerciseCount(workout: Workout): number {
    return workout.exercises.length;
  }

  getTotalSets(workout: Workout): number {
    return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  }

  // History methods
  selectExercise(exerciseName: string | null) {
    this.selectedExerciseForHistory.set(exerciseName);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Goal Modal Methods
  openAddGoalModal() {
    this.editingGoal.set(null);
    this.editingGoalIndex.set(null);
    this.goalForm.set({
      title: '',
      current: 0,
      target: 0,
      unit: 'lbs',
      deadline: ''
    });
    this.showGoalModal.set(true);
  }

  openEditGoalModal(goal: Goal, index: number) {
    this.editingGoal.set(goal);
    this.editingGoalIndex.set(index);
    this.goalForm.set({ ...goal });
    this.showGoalModal.set(true);
  }

  async saveGoal() {
    const goals = [...this.goals()];
    const index = this.editingGoalIndex();
    
    if (index !== null) {
      goals[index] = this.goalForm();
    } else {
      goals.push(this.goalForm());
    }
    
    this.goals.set(goals);
    await this.userData.updateData('goals/list', { data: goals });
    this.closeGoalModal();
  }

  async deleteGoal(index: number) {
    if (confirm('Are you sure you want to delete this goal?')) {
      const goals = this.goals().filter((_, i) => i !== index);
      this.goals.set(goals);
      await this.userData.updateData('goals/list', { data: goals });
    }
  }

  closeGoalModal() {
    this.showGoalModal.set(false);
    this.editingGoal.set(null);
    this.editingGoalIndex.set(null);
  }

  // Meal Modal Methods
  openAddMealModal() {
    this.editingMeal.set(null);
    this.editingMealIndex.set(null);
    this.mealForm.set({
      name: '',
      time: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
    this.showMealModal.set(true);
  }

  openEditMealModal(meal: Meal, index: number) {
    this.editingMeal.set(meal);
    this.editingMealIndex.set(index);
    this.mealForm.set({ ...meal });
    this.showMealModal.set(true);
  }

  async saveMeal() {
    const meals = [...this.mealPlan()];
    const index = this.editingMealIndex();
    
    if (index !== null) {
      meals[index] = this.mealForm();
    } else {
      meals.push(this.mealForm());
    }
    
    this.mealPlan.set(meals);
    await this.userData.updateData('meals/plan', { data: meals });
    this.closeMealModal();
  }

  async deleteMeal(index: number) {
    if (confirm('Are you sure you want to delete this meal?')) {
      const meals = this.mealPlan().filter((_, i) => i !== index);
      this.mealPlan.set(meals);
      await this.userData.updateData('meals/plan', { data: meals });
    }
  }

  closeMealModal() {
    this.showMealModal.set(false);
    this.editingMeal.set(null);
    this.editingMealIndex.set(null);
  }

  // Workout Modal Methods
  openAddWorkoutModal() {
    this.editingWorkout.set(null);
    this.editingWorkoutIndex.set(null);
    this.workoutForm.set({
      exercise: '',
      sets: 0,
      reps: 0,
      weight: 0,
      completed: false
    });
    this.showWorkoutModal.set(true);
  }

  openEditWorkoutModal(workout: WorkoutSet, index: number) {
    this.editingWorkout.set(workout);
    this.editingWorkoutIndex.set(index);
    this.workoutForm.set({ ...workout });
    this.showWorkoutModal.set(true);
  }

  async saveWorkout() {
    const workouts = [...this.todayWorkout()];
    const index = this.editingWorkoutIndex();
    
    if (index !== null) {
      workouts[index] = this.workoutForm();
    } else {
      workouts.push(this.workoutForm());
    }
    
    this.todayWorkout.set(workouts);
    await this.userData.updateData('workout/today', { data: workouts });
    this.closeWorkoutModal();
  }

  async deleteWorkout(index: number) {
    if (confirm('Are you sure you want to delete this workout?')) {
      const workouts = this.todayWorkout().filter((_, i) => i !== index);
      this.todayWorkout.set(workouts);
      await this.userData.updateData('workout/today', { data: workouts });
    }
  }

  closeWorkoutModal() {
    this.showWorkoutModal.set(false);
    this.editingWorkout.set(null);
    this.editingWorkoutIndex.set(null);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/auth']);
  }
}