import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { UserDataService } from '../services/user-data.service';
import { WorkoutService, Workout, WorkoutHistoryEntry } from '../services/workout.service';

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

interface DashboardState {
  
  userName: string;
  userStreak: number;
  
  
  todayWorkout: WorkoutSet[];
  goals: Goal[];
  mealPlan: Meal[];
  progressData: ProgressData[];
  workouts: Workout[];
  workoutHistory: WorkoutHistoryEntry[];
  

  selectedExerciseForHistory: string | null;
  showGoalModal: boolean;
  showMealModal: boolean;
  showWorkoutModal: boolean;
  showProgressModal: boolean;
  
  
  editingGoalIndex: number | null;
  editingMealIndex: number | null;
  editingWorkoutIndex: number | null;
  editingProgressIndex: number | null;
  
 
  goalForm: Goal;
  mealForm: Meal;
  workoutForm: WorkoutSet;
  progressForm: ProgressData;
}

const initialState: DashboardState = {
  userName: 'Loading...',
  userStreak: 0,
  todayWorkout: [],
  goals: [],
  mealPlan: [],
  progressData: [],
  workouts: [],
  workoutHistory: [],
  selectedExerciseForHistory: null,
  showGoalModal: false,
  showMealModal: false,
  showWorkoutModal: false,
  showProgressModal: false,
  editingGoalIndex: null,
  editingMealIndex: null,
  editingWorkoutIndex: null,
  editingProgressIndex: null,
  goalForm: {
    title: '',
    current: 0,
    target: 0,
    unit: 'lbs',
    deadline: ''
  },
  mealForm: {
    name: '',
    time: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  },
  workoutForm: {
    exercise: '',
    sets: 0,
    reps: 0,
    weight: 0,
    completed: false
  },
  progressForm: {
    date: '',
    weight: 0,
    workouts: 0
  }
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  
  withComputed((store) => ({
   
    totalCalories: computed(() =>
      store.mealPlan().reduce((sum, meal) => sum + meal.calories, 0)
    ),
    totalProtein: computed(() =>
      store.mealPlan().reduce((sum, meal) => sum + meal.protein, 0)
    ),
    totalCarbs: computed(() =>
      store.mealPlan().reduce((sum, meal) => sum + meal.carbs, 0)
    ),
    totalFats: computed(() =>
      store.mealPlan().reduce((sum, meal) => sum + meal.fats, 0)
    ),
    
   
    completedSets: computed(() =>
      store.todayWorkout().filter(w => w.completed).length
    ),
    totalSets: computed(() => store.todayWorkout().length),
    workoutProgress: computed(() => {
      const total = store.todayWorkout().length;
      if (total === 0) return 0;
      const completed = store.todayWorkout().filter(w => w.completed).length;
      return Math.round((completed / total) * 100);
    }),
    
    totalExercises: computed(() =>
      store.workouts().reduce((sum, workout) => sum + workout.exercises.length, 0)
    ),
    totalWorkoutSets: computed(() =>
      store.workouts().reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.length, 0
        ), 0
      )
    ),
    
  
    recentHistory: computed(() => store.workoutHistory().slice(0, 10)),
    uniqueExercises: computed(() => {
      const exercises = new Set(store.workoutHistory().map(h => h.exerciseName));
      return Array.from(exercises).sort();
    }),
    filteredHistory: computed(() => {
      const selected = store.selectedExerciseForHistory();
      const history = store.workoutHistory();
      if (!selected) return history.slice(0, 10);
      return history.filter(h => h.exerciseName === selected).slice(0, 10);
    }),
    
    
    isGoalFormValid: computed(() => {
      const form = store.goalForm();
      return form.title.trim() !== '' && form.target > 0 && form.deadline !== '';
    }),
    isMealFormValid: computed(() => {
      const form = store.mealForm();
      return form.name.trim() !== '' && form.time !== '';
    }),
    isWorkoutFormValid: computed(() => {
      const form = store.workoutForm();
      return form.exercise.trim() !== '' && form.sets > 0 && form.reps > 0;
    })
  })),
  
  withMethods((store, userDataService = inject(UserDataService), workoutService = inject(WorkoutService)) => ({
   
    setUserName(name: string) {
      patchState(store, { userName: name });
    },
    
    async loadAllData() {
      try {
        const [workout, goals, meals, progress, workouts, history] = await Promise.all([
          userDataService.getData('workout/today'),
          userDataService.getData('goals/list'),
          userDataService.getData('meals/plan'),
          userDataService.getData('progress/weekly'),
          workoutService.loadWorkouts(),
          workoutService.loadHistory()
        ]);
        
        patchState(store, {
          todayWorkout: workout?.['data'] ?? [],
          goals: goals?.['data'] ?? [],
          mealPlan: meals?.['data'] ?? [],
          progressData: progress?.['data'] ?? [],
          workouts: workouts,
          workoutHistory: history
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    },
    
    
    async toggleWorkoutComplete(index: number) {
      const workouts = [...store.todayWorkout()];
      workouts[index].completed = !workouts[index].completed;
      patchState(store, { todayWorkout: workouts });
      await userDataService.updateData('workout/today', { data: workouts });
    },
    
  
    openAddGoalModal() {
      patchState(store, {
        editingGoalIndex: null,
        goalForm: {
          title: '',
          current: 0,
          target: 0,
          unit: 'lbs',
          deadline: ''
        },
        showGoalModal: true
      });
    },
    
    openEditGoalModal(goal: Goal, index: number) {
      patchState(store, {
        editingGoalIndex: index,
        goalForm: { ...goal },
        showGoalModal: true
      });
    },
    
    async saveGoal() {
      const goals = [...store.goals()];
      const index = store.editingGoalIndex();
      
      if (index !== null) {
        goals[index] = store.goalForm();
      } else {
        goals.push(store.goalForm());
      }
      
      patchState(store, { goals, showGoalModal: false, editingGoalIndex: null });
      await userDataService.updateData('goals/list', { data: goals });
    },
    
    async deleteGoal(index: number) {
      if (confirm('Are you sure you want to delete this goal?')) {
        const goals = store.goals().filter((_, i) => i !== index);
        patchState(store, { goals });
        await userDataService.updateData('goals/list', { data: goals });
      }
    },
    
    closeGoalModal() {
      patchState(store, { showGoalModal: false, editingGoalIndex: null });
    },
    
    updateGoalForm(updates: Partial<Goal>) {
      patchState(store, { goalForm: { ...store.goalForm(), ...updates } });
    },
    
    
    openAddMealModal() {
      patchState(store, {
        editingMealIndex: null,
        mealForm: {
          name: '',
          time: '',
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        },
        showMealModal: true
      });
    },
    
    openEditMealModal(meal: Meal, index: number) {
      patchState(store, {
        editingMealIndex: index,
        mealForm: { ...meal },
        showMealModal: true
      });
    },
    
    async saveMeal() {
      const meals = [...store.mealPlan()];
      const index = store.editingMealIndex();
      
      if (index !== null) {
        meals[index] = store.mealForm();
      } else {
        meals.push(store.mealForm());
      }
      
      patchState(store, { mealPlan: meals, showMealModal: false, editingMealIndex: null });
      await userDataService.updateData('meals/plan', { data: meals });
    },
    
    async deleteMeal(index: number) {
      if (confirm('Are you sure you want to delete this meal?')) {
        const meals = store.mealPlan().filter((_, i) => i !== index);
        patchState(store, { mealPlan: meals });
        await userDataService.updateData('meals/plan', { data: meals });
      }
    },
    
    closeMealModal() {
      patchState(store, { showMealModal: false, editingMealIndex: null });
    },
    
    updateMealForm(updates: Partial<Meal>) {
      patchState(store, { mealForm: { ...store.mealForm(), ...updates } });
    },
    
    // Workout modal methods
    openAddWorkoutModal() {
      patchState(store, {
        editingWorkoutIndex: null,
        workoutForm: {
          exercise: '',
          sets: 0,
          reps: 0,
          weight: 0,
          completed: false
        },
        showWorkoutModal: true
      });
    },
    
    openEditWorkoutModal(workout: WorkoutSet, index: number) {
      patchState(store, {
        editingWorkoutIndex: index,
        workoutForm: { ...workout },
        showWorkoutModal: true
      });
    },
    
    async saveWorkout() {
      const workouts = [...store.todayWorkout()];
      const index = store.editingWorkoutIndex();
      
      if (index !== null) {
        workouts[index] = store.workoutForm();
      } else {
        workouts.push(store.workoutForm());
      }
      
      patchState(store, { todayWorkout: workouts, showWorkoutModal: false, editingWorkoutIndex: null });
      await userDataService.updateData('workout/today', { data: workouts });
    },
    
    async deleteWorkout(index: number) {
      if (confirm('Are you sure you want to delete this workout?')) {
        const workouts = store.todayWorkout().filter((_, i) => i !== index);
        patchState(store, { todayWorkout: workouts });
        await userDataService.updateData('workout/today', { data: workouts });
      }
    },
    
    closeWorkoutModal() {
      patchState(store, { showWorkoutModal: false, editingWorkoutIndex: null });
    },
    
    updateWorkoutForm(updates: Partial<WorkoutSet>) {
      patchState(store, { workoutForm: { ...store.workoutForm(), ...updates } });
    },
    

    selectExercise(exerciseName: string | null) {
      patchState(store, { selectedExerciseForHistory: exerciseName });
    }
  }))
);