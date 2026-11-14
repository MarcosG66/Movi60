import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text as NativeText,
  View,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  AppFrame,
  BackHeader,
  Field,
  InfoSection,
  MenuRow,
  MetricCard,
  PrimaryButton,
  QuickAction,
  ScreenHeader,
  SecondaryButton,
  StaffNav,
  StudentNav,
  Text,
  TextButton,
  TextInput,
} from "./components"
import { COLORS, styles } from "./styles/theme"
import Activity from "lucide-react-native/icons/activity"
import Bot from "lucide-react-native/icons/bot"
import CalendarDays from "lucide-react-native/icons/calendar-days"
import Check from "lucide-react-native/icons/check"
import ChevronRight from "lucide-react-native/icons/chevron-right"
import Clock3 from "lucide-react-native/icons/clock-3"
import Dumbbell from "lucide-react-native/icons/dumbbell"
import Eye from "lucide-react-native/icons/eye"
import LockKeyhole from "lucide-react-native/icons/lock-keyhole"
import Mail from "lucide-react-native/icons/mail"
import Pencil from "lucide-react-native/icons/pencil"
import Plus from "lucide-react-native/icons/plus"
import ShieldCheck from "lucide-react-native/icons/shield-check"
import Trash2 from "lucide-react-native/icons/trash"
import TrendingUp from "lucide-react-native/icons/trending-up"
import UserRound from "lucide-react-native/icons/user-round"
import UsersRound from "lucide-react-native/icons/users-round"
import { askAssistant } from "./services/assistant"
import { allUsers, resetPassword, signIn, signUp, updateUser, deleteUser, signOutUser, getUsersLoadError, restoreSession } from "./services/local"
import {
  loadExercises, loadWorkouts, loadHistory, loadPreferences,
  saveExercise as saveExerciseRemote, removeExercise as removeExerciseRemote,
  saveWorkout as saveWorkoutRemote, removeWorkout as removeWorkoutRemote,
  saveHistory as saveHistoryRemote, savePreferences as savePreferencesRemote,
  saveWorkoutCompletion,
} from "./services/firestore"
const ACCESS_SCALE = {
  small: 0.8,
  medium: 1,
  large: 1.2,
};
const roleLabels = {
  student: "Aluno",
  instructor: "Professor",
  admin: "Administrador",
}
const DEFAULT_ACCESS = {
  textSize: "medium",
  iconSize: "medium",
  fontFamily: "default",
  highContrast: false,
  largeButtons: true,
  simpleLanguage: true,
}
export default function App() {
  const [screen, setScreen] = useState("splash")
  const [user, setUser] = useState(null)
  const [studentTab, setStudentTab] = useState("home")
  const [staffTab, setStaffTab] = useState("dashboard")
  const [overlay, setOverlay] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [history, setHistory] = useState([])
  const [people, setPeople] = useState([])
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [access, setAccess] = useState(DEFAULT_ACCESS)
  const [accessOnboarding, setAccessOnboarding] = useState(false)
  const [notice, setNotice] = useState("")
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let mounted = true;
    // Restaura a sessão do Firebase Auth (ex.: ao recarregar a página com F5).
    restoreSession()
      .then((result) => {
        if (!mounted) return;
        if (result?.user) loginAs(result.user);
        else if (result?.message) setNotice(result.message);
      })
      .catch((error) => console.warn("Falha ao restaurar a sessão:", error))
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setWorkouts([]);
      setExercises([]);
      setAccess(DEFAULT_ACCESS);
      return;
    }

    let mounted = true;
    Promise.all([
      loadExercises(),
      loadWorkouts(user),
      loadHistory(user),
      loadPreferences(user.id),
    ]).then(([remoteExercises, remoteWorkouts, remoteHistory, preferences]) => {
      if (!mounted) return;
      setExercises(remoteExercises);
      setWorkouts(remoteWorkouts);
      setHistory(remoteHistory);
      setAccess({ ...DEFAULT_ACCESS, ...(preferences || {}) });
    }).catch((error) => {
      console.error("Erro ao sincronizar dados com o Firestore:", error);
      if (mounted) setNotice("Não foi possível sincronizar os dados. Verifique sua conexão e as regras do Firebase.");
    });

    return () => { mounted = false; };
  }, [user?.id, user?.role]);
  useEffect(()=>{ if(ready && screen==='splash')setScreen('login') },[ready,screen])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(""), 3200)
    return () => clearTimeout(timer)
  }, [notice])
  const palette = access.highContrast
    ? {
        background: COLORS.white,
        card: COLORS.white,
        text: COLORS.black,
        subtext: "#26303B",
        border: COLORS.black,
        primary: "#003B78",
      }
    : {
        background: COLORS.pale,
        card: COLORS.white,
        text: COLORS.ink,
        subtext: COLORS.slate,
        border: COLORS.border,
        primary: COLORS.blue,
      }
  const loginAs = (nextUser) => {
    void allUsers().then((list) => {
      setPeople(list);
      const loadError = getUsersLoadError();
      if (loadError) setNotice(`Erro ao carregar usuários: ${loadError}`);
    }).catch(()=>{});
    setUser(nextUser)
    setScreen("app")
    setStudentTab("home")
    setStaffTab("dashboard")
    if (nextUser.role === "student") {
      // A configuração inicial fica salva no Firebase (preferencias), valendo em qualquer aparelho.
      void Promise.all([
        AsyncStorage.getItem(`movi60:access:onboarded:${nextUser.id}`),
        loadPreferences(nextUser.id).catch(() => null),
      ]).then(([saved, preferences]) => {
        if (!saved && !preferences?.onboardingConcluido) {
          setAccessOnboarding(true)
          setOverlay("accessibility")
        }
      })
    }
  }
  const createPerson=async (input)=>{
    if(user?.role!=="admin") return "Acesso negado.";
    if(input.role==='student'&&input.instructorId&&!people.some(p=>p.id===input.instructorId&&p.role==='instructor')) return "Professor inválido.";
    const result=await signUp({...input,password:"123456",adminCreate:true});
    if(result.message) return result.message;
    if(input.instructorId) await updateUser({...result.user,instructorId:input.instructorId});
    setPeople(await allUsers()); setOverlay(null);setNotice("Usuário cadastrado. Senha inicial: 123456.");return null;
  };
  const closeAccessibility = () => {
    if (accessOnboarding && user) {
      void AsyncStorage.setItem(`movi60:access:onboarded:${user.id}`, "true")
      void savePreferencesRemote(user.id, { onboardingConcluido: true }).catch((error) => console.warn(error))
    }
    setAccessOnboarding(false)
    setOverlay(null)
  }
  const logout = () => {
    void signOutUser()
    setUser(null)
    setScreen("login")
    setOverlay(null)
  }
  const assignedWorkout = user?.role === 'student'
    ? workouts.find(w=>(w.studentId===user.id || (!w.studentId&&w.student?.toLocaleLowerCase('pt-BR')===user.name.toLocaleLowerCase('pt-BR'))) && (!w.date || w.date===new Date().toLocaleDateString('sv-SE')))
    : null;
  const workoutExercises = (assignedWorkout?.exercises||[]).map(id=>{
    const exercise=exercises.find(e=>e.id===id);
    return exercise ? {...exercise,...(assignedWorkout?.prescriptions?.[id]||{})}:null;
  }).filter(Boolean);
  const completed = history.filter(h=>h.userId===user?.id && h.workoutId===assignedWorkout?.id && h.date.slice(0,10)===new Date().toLocaleDateString('sv-SE')).map(h=>h.exerciseId);
  const registerExercise=(data)=>{
    const record={id:`h-${Date.now()}`,userId:user.id,userName:user.name||'',instructorId:user.instructorId||'',workoutId:assignedWorkout?.id||'',workoutName:assignedWorkout?.name||'Treino',professionalId:assignedWorkout?.professionalId||'',exerciseId:selectedExercise.id,exerciseName:selectedExercise.name,exerciseGroup:selectedExercise.group||'',prescribedSets:selectedExercise.sets??'',prescribedReps:selectedExercise.reps??'',date:new Date().toISOString(),sets:data.sets,reps:data.reps,load:data.load||'',notes:data.notes||'',concluido:true};
    const next=[...history.filter(h=>!(h.userId===user.id&&h.workoutId===record.workoutId&&h.exerciseId===record.exerciseId&&h.date.slice(0,10)===record.date.slice(0,10))),record];
    setHistory(next); void saveHistoryRemote(record).then(() => setNotice("Exercício registrado no Firebase.")).catch((error) => { console.error(error); setNotice("Não foi possível salvar o histórico no Firebase."); });
    setNotice('Exercício registrado com sucesso!');
    const ix=workoutExercises.findIndex(x=>x.id===selectedExercise.id);
    const order=[...workoutExercises.slice(ix+1),...workoutExercises.slice(0,ix)];
    const nextExercise=order.find(x=>!next.some(h=>h.userId===user.id && h.workoutId===record.workoutId && h.exerciseId===x.id && h.date.slice(0,10)===record.date.slice(0,10)));
    if(nextExercise){setSelectedExercise(nextExercise);setOverlay('exercise')}
    else {
      setOverlay('workout-finished');
      // Todos os exercícios do dia concluídos: grava o treino como completo no Firebase.
      if(assignedWorkout){
        const day=record.date.slice(0,10);
        const doneToday=next.filter(h=>h.userId===user.id&&h.workoutId===assignedWorkout.id&&h.date.slice(0,10)===day);
        void saveWorkoutCompletion({
          id:`${assignedWorkout.id}_${user.id}_${day}`,
          userId:user.id,userName:user.name||'',instructorId:user.instructorId||'',
          workoutId:assignedWorkout.id,workoutName:assignedWorkout.name||'Treino',
          professionalId:assignedWorkout.professionalId||'',
          day,date:new Date().toISOString(),
          totalExercicios:workoutExercises.length,exerciciosConcluidos:doneToday.map(h=>h.exerciseId),
          historicoIds:doneToday.map(h=>h.id),concluido:true,
        }).catch((error)=>console.warn('Não foi possível registrar o treino concluído:',error));
      }
    }
  };
  const askContext = selectedExercise;
  const confirmAction=(title,message,onConfirm)=>{
    if(Platform.OS==='web' && typeof window!=='undefined'){
      if(window.confirm(`${title}\n\n${message}`))onConfirm();
    } else Alert.alert(title,message,[{text:'Cancelar',style:'cancel'},{text:'Excluir',style:'destructive',onPress:onConfirm}]);
  };
  const saveAccess = (next) => {
    setAccess(next);
    if (user) void savePreferencesRemote(user.id, next).catch((error) => {
      console.error(error);
      setNotice("Não foi possível salvar as preferências no Firebase.");
    });
  }
  const saveExercise = async (exercise) => {
    if (user?.role !== "instructor" && user?.role !== "admin") return;
    try {
      await saveExerciseRemote(exercise);
      const next = exercises.some((item) => item.id === exercise.id)
        ? exercises.map((item) => (item.id === exercise.id ? exercise : item))
        : [...exercises, exercise];
      setExercises(next);
      setOverlay(null);
      setSelectedExercise(null);
      setNotice("Exercício salvo no Firebase.");
    } catch (error) {
      console.error(error);
      setNotice("Não foi possível salvar o exercício. Verifique as regras do Firestore.");
    }
  }
  const deleteExercise = (id) => (user?.role === "instructor" || user?.role === "admin") && confirmAction(
    "Excluir exercício?",
    "Esta ação removerá o exercício do catálogo e dos treinos associados.",
    async () => {
      const affected = workouts.filter((workout) => workout.exercises.includes(id));
      try {
        await Promise.all([
          removeExerciseRemote(id),
          ...affected.map((workout) => saveWorkoutRemote({
            ...workout,
            exercises: workout.exercises.filter((exerciseId) => exerciseId !== id),
          })),
        ]);
        setExercises((current) => current.filter((exercise) => exercise.id !== id));
        setWorkouts((current) => current.map((workout) => ({
          ...workout,
          exercises: workout.exercises.filter((exerciseId) => exerciseId !== id),
        })));
        setNotice("Exercício excluído do Firebase.");
      } catch (error) {
        console.error(error);
        setNotice("Não foi possível excluir o exercício no Firebase.");
      }
    }
  )
  const saveWorkout = async (workout) => {
    if (user?.role !== "instructor" && user?.role !== "admin") {
      const message = "Somente professores e administradores podem criar treinos.";
      setNotice(message);
      return message;
    }

    try {
      // Atualiza a lista antes de validar, evitando usar alunos desatualizados.
      const latestPeople = await allUsers();
      setPeople(latestPeople);
      const selectedStudent = latestPeople.find(
        (person) => person.id === workout.studentId && person.role === "student"
      );

      if (!selectedStudent) {
        const message = "Não encontrei esse aluno. Feche o formulário, abra novamente e selecione o aluno.";
        setNotice(message);
        return message;
      }
      if (user.role === "instructor" && selectedStudent.instructorId !== user.id) {
        const message = "Esse aluno não está vinculado ao seu perfil de professor.";
        setNotice(message);
        return message;
      }
      if (!workout.name?.trim() || !workout.exercises?.length) {
        const message = "Informe o nome do treino e selecione pelo menos um exercício.";
        setNotice(message);
        return message;
      }
      if (user.role === "instructor" && workout.id && workouts.some((item) => item.id === workout.id && item.professionalId !== user.id && item.professional !== user.name)) {
        const message = "Sem permissão para editar este treino.";
        setNotice(message);
        return message;
      }

      // Professor: o treino fica no nome dele.
      // Administrador: o treino fica no nome do professor do aluno (para o
      // professor também enxergá-lo); se o aluno não tiver professor, fica no do admin.
      const responsible = user.role === "admin"
        ? (latestPeople.find((person) => person.id === selectedStudent.instructorId && person.role === "instructor") || user)
        : user;
      const workoutToSave = {
        ...workout,
        student: selectedStudent.name,
        studentEmail: selectedStudent.email || "",
        professionalId: responsible.id,
        professional: responsible.name,
        createdById: user.id,
        // Cópia dos dados de cada exercício (com séries/repetições prescritas),
        // para o treino continuar completo no banco mesmo se o catálogo mudar.
        exerciciosDetalhes: workout.exercises.map((exerciseId, index) => {
          const exercise = exercises.find((item) => item.id === exerciseId) || {};
          const { criadoEm, atualizadoEm, ...exerciseData } = exercise;
          return {
            ...exerciseData,
            id: exerciseId,
            ordem: index + 1,
            ...(workout.prescriptions?.[exerciseId] || {}),
          };
        }),
      };
      await saveWorkoutRemote(workoutToSave);

      const next = workouts.some((item) => item.id === workoutToSave.id)
        ? workouts.map((item) => item.id === workoutToSave.id ? workoutToSave : item)
        : [...workouts, workoutToSave];
      setWorkouts(next);
      setOverlay(null);
      setSelectedWorkout(null);
      setNotice("Treino salvo no Firebase.");
      return true;
    } catch (error) {
      console.error("Erro detalhado ao salvar treino:", error);
      const message = `Erro ao salvar treino: ${error.code || error.message || "verifique as regras do Firestore"}`;
      setNotice(message);
      return message;
    }
  }
  const removeWorkout = (id) => (user?.role==='admin' || (user?.role==='instructor' && workouts.some(w=>w.id===id&&(w.professionalId===user.id||(!w.professionalId&&w.professional===user.name))))) && confirmAction('Excluir treino?', 'O treino será removido do planejamento do aluno.',()=>{
    const next=workouts.filter(w=>w.id!==id);
    void removeWorkoutRemote(id).then(() => {
      setWorkouts(next);
      setNotice("Treino excluído do Firebase.");
    }).catch((error) => {
      console.error(error);
      setNotice("Não foi possível excluir o treino no Firebase.");
    });
  });
  const savePerson=async (next)=>{
    if(user?.id===next.id && next.role!==user.role){setNotice('Você não pode alterar seu próprio perfil.');return;} 
    if(user?.role!=="admin" && user?.id!==next.id) return;
    if(user?.role!=="admin" && (next.role!==user.role||next.instructorId!==user.instructorId)) return;
    if(next.role==='student'&&next.instructorId&&!people.some(p=>p.id===next.instructorId&&p.role==='instructor')){setNotice("Professor inválido.");return;}
    try {
      await updateUser(next);
    } catch (error) {
      setNotice(error?.message || 'Não foi possível salvar o usuário no Firebase.');
      return;
    }
    const updated=await allUsers();setPeople(updated);
    if(user?.id===next.id)setUser(updated.find(u=>u.id===next.id)||{...user,...next});
    setOverlay(null);setNotice('Dados do usuário atualizados.');
  };
  // Vínculo rápido aluno -> professor (tela "Vincular alunos a professores").
  const assignStudent=async (student, instructorId)=>{
    if(user?.role!=='admin') return;
    if(instructorId&&!people.some(p=>p.id===instructorId&&p.role==='instructor')){setNotice('Professor inválido.');return;}
    try {
      await updateUser({...student,instructorId});
      setPeople(await allUsers());
      const teacher=people.find(p=>p.id===instructorId);
      setNotice(teacher?`${student.name} vinculado(a) a ${teacher.name}.`:`${student.name} ficou sem professor.`);
    } catch (error) {
      setNotice(error?.message || 'Não foi possível salvar o vínculo no Firebase.');
    }
  };
  const removePerson=(id)=>user?.role==='admin' && id!==user.id && confirmAction('Excluir usuário?','O perfil, os treinos agendados e o acesso ao aplicativo serão removidos. O histórico de atividades é mantido.',async()=>{
    const target=people.find(p=>p.id===id);
    const result=await deleteUser(id);
    if(target?.role==='instructor'){
      const students=people.filter(p=>p.role==='student'&&p.instructorId===id);
      await Promise.all(students.map(p=>updateUser({...p,instructorId:''})));
    }
    if(target?.role==='student') setWorkouts(ws=>ws.filter(w=>w.studentId!==id));
    setPeople(await allUsers());setOverlay(null);setNotice(result.message);
  });
  if (screen === "splash") return <SplashScreen />
  if (screen === "login" || screen === "register" || screen === "forgot") {
    return <AuthScreen mode={screen} onMode={setScreen} onLogin={loginAs} />
  }
  return (
    <AppFrame palette={palette} access={access}>
      {user?.role === "student" ? (
        <StudentApp
          user={user}
          tab={studentTab}
          onTab={setStudentTab}
          exercises={workoutExercises}
          workout={assignedWorkout}
          workouts={workouts.filter(w=>w.studentId===user.id)}
          history={history.filter(h=>h.userId===user?.id)}
          completed={completed}
          onExercise={(exercise) => {
            setSelectedExercise(exercise)
            setOverlay("exercise")
          }}
          onAssistant={() => {setSelectedExercise(null);setOverlay("assistant")}}
          onHistory={() => setOverlay("history")}
          onProfileDetails={() => setOverlay("profile-edit")}
          onAccessibility={() => setOverlay("accessibility")}
          onLogout={logout}
          palette={palette}
        />
      ) : (
        <StaffApp
          user={user}
          tab={staffTab}
          onTab={setStaffTab}
          exercises={exercises}
          workouts={workouts}
          people={people}
          history={history}
          onAddExercise={() => {
            setSelectedExercise(null)
            setOverlay("exercise-form")
          }}
          onEditExercise={(exercise) => {
            setSelectedExercise(exercise)
            setOverlay("exercise-form")
          }}
          onDeleteExercise={deleteExercise}
          onWorkout={async () => {
            try {
              const latestPeople = await allUsers();
              setPeople(latestPeople);
              setSelectedWorkout(null);
              setOverlay("workout-form");
            } catch (error) {
              console.error("Erro ao atualizar alunos:", error);
              setNotice("Não foi possível carregar a lista de alunos.");
            }
          }}
          onEditWorkout={(w)=>{setSelectedWorkout(w);setOverlay('workout-form')}}
          onDeleteWorkout={removeWorkout}
          onNewUser={() => {if(user?.role==='admin')setOverlay('new-person')}}
          onAssign={async () => {
            if(user?.role!=='admin') return;
            const latest=await allUsers(); setPeople(latest);
            const loadError=getUsersLoadError();
            if(loadError) setNotice(`Erro ao carregar usuários: ${loadError}`);
            setOverlay('assign');
          }}
          onPerson={(person) => {
            setSelectedPerson(person)
            setOverlay("person")
          }}
          onAccessibility={() => setOverlay("accessibility")}
          onProfileDetails={() => setOverlay("profile-edit")}
          onLogout={logout}
          palette={palette}
        />
      )}

      <Modal
        visible={overlay !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOverlay(null)}
      >
        <AppFrame palette={palette} access={access}>
          {overlay === "exercise" && selectedExercise && (
            <ExerciseDetail
              exercise={selectedExercise}
              done={completed.includes(selectedExercise.id)}
              onComplete={() => setOverlay('register-exercise')}
              onExecute={() => setOverlay('execute-exercise')}
              onAsk={() => setOverlay('assistant') }
              onBack={() => setOverlay(null)}
              palette={palette}
            />
          )}
          {overlay === 'execute-exercise' && selectedExercise && (
            <ExecutionScreen exercise={selectedExercise} onBack={()=>setOverlay('exercise')} onRegister={()=>setOverlay('register-exercise')} palette={palette}/>
          )}
          {overlay === 'register-exercise' && selectedExercise && (
            <RegistrationScreen key={selectedExercise.id} exercise={selectedExercise} onBack={()=>setOverlay('execute-exercise')} onSave={registerExercise} palette={palette}/>
          )}
          {overlay === 'workout-finished' && (
            <FinishedScreen onBack={()=>setOverlay(null)} onHistory={()=>setOverlay('history')} palette={palette}/>
          )}
          {overlay === 'history' && (
            <HistoryScreen history={history.filter(h=>h.userId===user?.id)} onBack={()=>setOverlay(null)} palette={palette}/>
          )}
          {overlay === "assistant" && (
            <AssistantScreen exercise={askContext} onBack={() => setOverlay(askContext?'exercise':null)} palette={palette} />
          )}
          {overlay === "accessibility" && (
            <AccessibilityScreen
              value={access}
              onChange={saveAccess}
              onBack={closeAccessibility}
              palette={palette}
              onboarding={accessOnboarding}
            />
          )}
          {overlay === "exercise-form" && (
            <ExerciseForm
              value={selectedExercise}
              onSave={saveExercise}
              onBack={() => setOverlay(null)}
              palette={palette}
            />
          )}
          {overlay === "workout-form" && (
            <WorkoutForm
              key={selectedWorkout?.id || "new"}
              value={selectedWorkout}
              exercises={exercises}
              people={people.filter(p=>p.role==='student'&&(user?.role==='admin'||p.instructorId===user?.id))}
              professional={user}
              onSave={saveWorkout}
              onBack={() => setOverlay(null)}
              palette={palette}
            />
          )}
          {overlay === 'profile-edit' && user && (
            <PersonDetail key={user.id} person={user} people={people} history={history.filter(h=>h.userId===user.id)} onSave={savePerson} admin={false} self onBack={()=>setOverlay(null)} palette={palette}/>
          )}
          {overlay === "assign" && user?.role === "admin" && (
            <AssignStudentsScreen people={people} onAssign={assignStudent} onBack={()=>setOverlay(null)} palette={palette}/>
          )}
          {overlay === "new-person" && user?.role === "admin" && (
            <CreateUserScreen people={people} onSave={createPerson} onBack={()=>setOverlay(null)} palette={palette}/>
          )}
          {overlay === "person" && selectedPerson && (
            <PersonDetail
              key={selectedPerson.id}
              person={selectedPerson}
              history={history.filter(h=>h.userId===selectedPerson.id)}
              people={people}
              onSave={savePerson}
              onDelete={()=>removePerson(selectedPerson.id)}
              admin={user?.role === "admin"}
              onBack={() => setOverlay(null)}
              palette={palette}
            />
          )}
        </AppFrame>
      </Modal>
      {!!notice && (
        <View style={styles.toast} accessibilityLiveRegion="polite">
          <Check color={COLORS.white} size={22} />
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      )}
    </AppFrame>
  )
}
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <BrandMark light />
      <Text style={styles.splashTitle}>Movi60</Text>
      <Text style={styles.splashSubtitle}>Academia e Bem-Estar</Text>
      <ActivityIndicator
        color={COLORS.white}
        size="large"
        style={styles.splashLoader}
      />
    </View>
  )
}
function BrandMark({ light = false }) {
  return (
    <View style={[styles.brandMark, light && styles.brandMarkLight]}>
      <Activity
        size={40}
        strokeWidth={2.5}
        color={light ? COLORS.navy : COLORS.white}
      />
    </View>
  )
}
function AuthScreen({ mode, onMode, onLogin }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [birth, setBirth] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const submit = async () => {
    setMessage("")
    if (!email) return setMessage("Informe seu e-mail.")
    if (mode === "forgot") {
      setLoading(true)
      const result = await resetPassword(email)
      setLoading(false)
      setMessage(result.message)
      return
    }
    if (!password) return setMessage("Informe sua senha.")
    if (mode === "register" && (!name || password !== confirm)) {
      return setMessage(
        !name ? "Informe seu nome completo." : "As senhas precisam ser iguais.",
      )
    }
    setLoading(true)
    const result =
      mode === "register"
        ? await signUp({ name, email, password, birthDate: birth, role: "student" })
        : await signIn(email, password)
    setLoading(false)
    if (result.user) onLogin(result.user)
    else setMessage(result.message)
  }
  return (
    <View style={styles.authStage}>
      <ScrollView
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authBrandRow}>
          <BrandMark />
          <View>
            <Text style={styles.authBrand}>Movi60</Text>
            <Text style={styles.authTagline}>Academia e Bem-Estar</Text>
          </View>
        </View>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {mode === "login"
              ? "Bem-vindo!"
              : mode === "register"
                ? "Criar minha conta"
                : "Recuperar senha"}
          </Text>
          <Text style={styles.authHelp}>
            {mode === "login"
              ? "Entre para cuidar da sua saúde com segurança."
              : mode === "register"
                ? "Preencha seus dados para começar."
                : "Enviaremos instruções para o seu e-mail."}
          </Text>
          {mode === "register" && (
            <>
              <Field
                label="Nome completo"
                value={name}
                onChangeText={setName}
                icon={UserRound}
              />
              <Field
                label="Data de nascimento"
                value={birth}
                onChangeText={setBirth}
                placeholder="DD/MM/AAAA"
                icon={CalendarDays}
              />
            </>
          )}
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon={Mail}
          />
          {mode !== "forgot" && (
            <Field
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={LockKeyhole}
            />
          )}
          {mode === "register" && (
            <>
              <Field
                label="Confirmar senha"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                icon={ShieldCheck}
              />
              <Text style={styles.authHelp}>Sua conta será criada como aluno. Professores e administradores são cadastrados pela gestão da academia.</Text>

            </>
          )}
          {!!message && <Text style={styles.formMessage}>{message}</Text>}
          <PrimaryButton
            label={
              loading
                ? "Aguarde..."
                : mode === "forgot"
                  ? "Enviar instruções"
                  : mode === "register"
                    ? "Criar conta"
                    : "Entrar"
            }
            onPress={submit}
            disabled={loading}
          />
          {mode === "login" ? (
            <>
              <TextButton
                label="Esqueci minha senha"
                onPress={() => onMode("forgot")}
              />
              <View style={styles.divider} />
              <SecondaryButton
                label="Criar minha conta"
                onPress={() => onMode("register")}
              />
            </>
          ) : (
            <TextButton
              label="Voltar para o login"
              onPress={() => onMode("login")}
            />
          )}
        </View>
        <Text style={styles.securityText}>
          Sua conta é protegida pelo Firebase. Não compartilhe sua senha.
        </Text>
      </ScrollView>
    </View>
  )
}
function StudentApp({
  user,
  tab,
  onTab,
  exercises,
  workout,
  workouts = [],
  history,
  completed,
  onExercise,
  onAssistant,
  onHistory,
  onProfileDetails,
  onAccessibility,
  onLogout,
  palette,
}) {
  const title = {
    home: "Início",
    workout: "Meu treino",
    progress: "Minha evolução",
    schedule: "Agenda",
    profile: "Meu perfil",
  }[tab]
  return (
    <>
      <ScreenHeader
        title={title}
        subtitle={tab === "home" ? new Intl.DateTimeFormat("pt-BR", {weekday:"long",day:"numeric",month:"long"}).format(new Date()) : undefined}
        palette={palette}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" && (
          <HomeScreen
            user={user}
            exercises={exercises}
            workout={workout}
            history={history}
            completed={completed}
            onWorkout={() => onTab("workout")}
            onProgress={()=>onTab('progress')}
            onSchedule={()=>onTab('schedule')}
            onAssistant={onAssistant}
            palette={palette}
          />
        )}
        {tab === "workout" && (
          <WorkoutScreen
            exercises={exercises}
            workout={workout}
            completed={completed}
            onExercise={onExercise}
            palette={palette}
          />
        )}
        {tab === "progress" && <ProgressScreen history={history} onHistory={onHistory} palette={palette} />}
        {tab === "schedule" && <ScheduleScreen workouts={workouts} palette={palette} />}
        {tab === "profile" && (
          <ProfileScreen
            user={user}
            onDetails={onProfileDetails}
            onHistory={onHistory}
            onAccessibility={onAccessibility}
            onLogout={onLogout}
            palette={palette}
          />
        )}
      </ScrollView>
      <StudentNav active={tab} onChange={onTab} palette={palette} />
    </>
  )
}
function HomeScreen({
  user,
  exercises,
  workout,
  history,
  completed,
  onWorkout,
  onProgress,
  onSchedule,
  onAssistant,
  palette,
}) {
  const firstName = user.name.split(" ")[0]
  return (
    <View style={styles.gap}>
      <View>
        <Text style={[styles.heroTitle, { color: palette.text }]}>
          Olá, {firstName}!
        </Text>
        <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
          Vamos cuidar do seu bem-estar hoje?
        </Text>
      </View>
      <View style={styles.workoutHero}>
        <View style={styles.eyebrowRow}>
          <Dumbbell color={COLORS.white} size={20} />
          <Text style={styles.heroEyebrow}>TREINO DE HOJE</Text>
        </View>
        <Text style={styles.workoutHeroTitle}>{workout?.name||'Aguardando treino'}</Text>
        <Text style={styles.workoutHeroSubtitle}>{workout?.notes||'Seu professor poderá cadastrar um treino para você.'}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>{exercises.length} exercícios</Text>
          <Text style={styles.heroDot}>•</Text>
          <Text style={styles.heroMeta}>{workout?.duration||'Sem duração definida'}</Text>
        </View>
        <Pressable
          style={styles.heroButton}
          onPress={onWorkout}
          accessibilityRole="button"
        >
          <Text style={styles.heroButtonText}>
            {workout ? (completed.length ? 'Continuar treino' : 'Ver meu treino') : 'Ver treinos'}
          </Text>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
      </View>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Seu progresso
        </Text>
        <Pressable onPress={onProgress}><Text style={styles.sectionAction}>Ver evolução</Text></Pressable>
      </View>
      <View style={styles.metricRow}>
        <MetricCard
          icon={Check}
          value={String(new Set(history.filter(h=>h.concluido).map(h=>h.date.slice(0,10))).size)}
          label="Dias de treino"
          color={COLORS.green}
          palette={palette}
        />
        <MetricCard
          icon={TrendingUp}
          value={String(history.filter(h=>h.concluido).length)}
          label="Exercícios feitos"
          color={COLORS.blue}
          palette={palette}
        />
      </View>
      <Pressable onPress={onSchedule}
        style={[
          styles.nextCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View style={styles.nextIcon}>
          <CalendarDays color={COLORS.blue} size={26} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.cardKicker, { color: palette.subtext }]}>
            PRÓXIMA ATIVIDADE
          </Text>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Alongamento
          </Text>
          <Text style={[styles.cardBody, { color: palette.subtext }]}>
            Hoje, às 15:00
          </Text>
        </View>
        <ChevronRight color={palette.subtext} size={24} />
      </Pressable>
      <Pressable
        style={styles.aiCard}
        onPress={onAssistant}
        accessibilityRole="button"
      >
        <View style={styles.aiIcon}>
          <Bot color={COLORS.blue} size={28} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.aiTitle}>Assistente Movi60</Text>
          <Text style={styles.aiText}>
            Tire suas dúvidas sobre os exercícios
          </Text>
        </View>
        <ChevronRight color={COLORS.blue} size={24} />
      </Pressable>
    </View>
  )
}
function WorkoutScreen({ exercises, workout, completed, onExercise, palette }) {
  const percent = Math.round(
    (completed.length / Math.max(exercises.length, 1)) * 100,
  )
  if(!workout) return <View style={styles.summaryCard}><Text style={styles.sectionTitle}>Nenhum treino atribuído</Text><Text style={styles.cardBody}>Peça ao professor para atribuir um treino ao seu nome.</Text></View>;
  return (
    <View style={styles.gap}>
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View style={styles.sectionRow}>
          <View>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {workout.name}
            </Text>
            <Text style={[styles.cardBody, { color: palette.subtext }]}>
              {workout.duration || 'Duração livre'} · {workout.date || 'Sem data'}
            </Text>
          </View>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={[styles.progressLabel, { color: palette.subtext }]}>
          {completed.length} de {exercises.length} exercícios concluídos
        </Text>
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Exercícios de hoje
      </Text>
      {exercises.map((exercise, index) => {
        const done = completed.includes(exercise.id)
        return (
          <Pressable
            key={exercise.id}
            style={[
              styles.exerciseCard,
              {
                backgroundColor: palette.card,
                borderColor: done ? COLORS.green : palette.border,
              },
            ]}
            onPress={() => onExercise(exercise)}
          >
            <View
              style={[styles.exerciseNumber, done && styles.exerciseNumberDone]}
            >
              {done ? (
                <Check color={COLORS.white} size={20} />
              ) : (
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.exerciseTitle, { color: palette.text }]}>
                {exercise.name}
              </Text>
              <Text style={[styles.exerciseGroup, { color: palette.subtext }]}>
                {exercise.group}
              </Text>
              <Text style={[styles.exerciseMeta, { color: palette.text }]}>
                {exercise.sets} {exercise.sets === 1 ? "série" : "séries"} ·{" "}
                {exercise.reps}
              </Text>
            </View>
            <ChevronRight color={palette.subtext} size={24} />
          </Pressable>
        )
      })}
      {exercises.length > 0 && completed.length === exercises.length && (
        <View style={styles.successCard}>
          <Check color={COLORS.green} size={30} />
          <View style={styles.flex}>
            <Text style={styles.successTitle}>Parabéns!</Text>
            <Text style={styles.successText}>Seu treino foi concluído.</Text>
          </View>
        </View>
      )}
    </View>
  )
}
function ExerciseDetail({
  exercise,
  done,
  onComplete,
  onExecute,
  onAsk,
  onBack,
  palette,
}) {
  return (
    <>
      <BackHeader
        title="Detalhes do exercício"
        onBack={onBack}
        palette={palette}
      />
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.exerciseIllustration}>
          {exercise.image ? <Image source={{uri:exercise.image}} style={{width:'100%',height:190,borderRadius:14}} resizeMode="contain" /> : <Dumbbell color={COLORS.blue} size={58} strokeWidth={1.6} />}
        </View>
        <Text style={[styles.detailTitle, { color: palette.text }]}>
          {exercise.name}
        </Text>
        <Text style={styles.detailGroup}>{exercise.group}</Text>
        <View style={styles.prescription}>
          <Text style={styles.prescriptionText}>
            {exercise.sets} séries de {exercise.reps}
          </Text>
        </View>
        <InfoSection
          title="Como fazer"
          text={exercise.instructions}
          palette={palette}
        />
        <View style={styles.safetyCard}>
          <ShieldCheck color={COLORS.amber} size={26} />
          <View style={styles.flex}>
            <Text style={styles.safetyTitle}>Dica de segurança</Text>
            <Text style={styles.safetyText}>
              {exercise.care || 'Respeite seus limites e siga sempre a orientação do profissional da academia.'}
            </Text>
          </View>
        </View>
        <PrimaryButton label="Iniciar execução" icon={Dumbbell} onPress={onExecute} />
        <SecondaryButton label={done ? 'Atualizar registro' : 'Registrar exercício'} icon={Check} onPress={onComplete} />
        <SecondaryButton label="Perguntar à IA" icon={Bot} onPress={onAsk} />
      </ScrollView>
    </>
  )
}
function ProgressScreen({history,onHistory,palette}) {
  const current=history.filter(h=>h.concluido);
  const totalDays=new Set(current.map(h=>h.date.slice(0,10))).size;
  const last7=current.filter(h=>new Date(h.date).getTime()>=Date.now()-7*86400000);
  const bars=Array.from({length:4},(_,i)=>{
    const start=Date.now()-(27-i*7)*86400000;
    return Math.max(0, Math.min(105, current.filter(h=>new Date(h.date).getTime()>=start&&new Date(h.date).getTime()<start+7*86400000).length*22));
  });
  return <View style={styles.gap}>
    <View style={styles.progressHero}><Text style={styles.progressHeroValue}>{totalDays}</Text><Text style={styles.progressHeroLabel}>dias com atividades registradas</Text><Text style={styles.progressHeroMessage}>Continue acompanhando seus exercícios!</Text></View>
    <View style={styles.metricRow}>
      <MetricCard icon={CalendarDays} value={String(last7.length)} label="Na última semana" color={COLORS.blue} palette={palette}/>
      <MetricCard icon={Check} value={String(current.length)} label="Exercícios" color={COLORS.green} palette={palette}/>
    </View>
    <View style={[styles.chartCard,{backgroundColor:palette.card,borderColor:palette.border}]}><Text style={[styles.sectionTitle,{color:palette.text}]}>Frequência das últimas 4 semanas</Text>
      <Text style={[styles.cardBody,{color:palette.subtext}]}>Exercícios registrados por semana</Text>
      <View style={styles.barChart}>{bars.map((height,i)=><View key={i} style={styles.barColumn}><View style={[styles.bar,{height}]}/><Text style={[styles.barLabel,{color:palette.subtext}]}>Sem {i+1}</Text></View>)}</View>
    </View>
    <PrimaryButton label="Ver histórico completo" onPress={onHistory}/>
    <Text style={[styles.sectionTitle,{color:palette.text}]}>Atividades recentes</Text>
    {current.length===0?<Text style={{color:palette.subtext}}>Seus registros aparecerão aqui após concluir o primeiro exercício.</Text>: current.slice().reverse().slice(0,5).map(h=><View key={h.id} style={[styles.historyRow,{borderColor:palette.border}]}><View style={styles.historyIcon}><Check color={COLORS.green} size={20}/></View><View style={styles.flex}><Text style={[styles.historyTitle,{color:palette.text}]}>{h.exerciseName}</Text><Text style={[styles.cardBody,{color:palette.subtext}]}>{new Date(h.date).toLocaleDateString('pt-BR')}</Text></View></View>)}
  </View>;
}
function ScheduleScreen({ workouts = [], palette }) {
  // Agenda montada a partir dos treinos reais do aluno (hoje em diante).
  const today = new Date().toLocaleDateString('sv-SE')
  const schedule = workouts
    .filter((w) => w.date && w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => {
      const when = new Date(`${w.date}T12:00:00`)
      return {
        id: w.id,
        title: w.name,
        date: `${String(when.getDate()).padStart(2,'0')} ${when.toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase()}`,
        day: w.date === today ? 'Hoje' : when.toLocaleDateString('pt-BR',{weekday:'long'}),
        time: w.duration || '',
        kind: w.professional ? `Com Prof. ${w.professional}` : 'Treino',
      }
    })
  return (
    <View style={styles.gap}>
      <View style={styles.monthCard}>
        <CalendarDays color={COLORS.blue} size={28} />
        <View style={styles.flex}>
          <Text style={styles.monthTitle}>{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date())}</Text>
          <Text style={styles.monthSubtitle}>{schedule.length === 1 ? '1 atividade agendada' : `${schedule.length} atividades agendadas`}</Text>
        </View>
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Próximas atividades
      </Text>
      {schedule.length === 0 && (
        <Text style={[styles.cardBody, { color: palette.subtext }]}>
          Nenhum treino agendado. Seu professor cadastrará os próximos treinos.
        </Text>
      )}
      {schedule.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.scheduleCard,
            {
              backgroundColor: palette.card,
              borderColor: index === 0 ? COLORS.blue : palette.border,
            },
          ]}
        >
          <View style={styles.dateBlock}>
            <Text style={styles.dateDay}>{item.date.split(" ")[0]}</Text>
            <Text style={styles.dateMonth}>{item.date.split(" ")[1]}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.scheduleDay, { color: palette.subtext }]}>
              {item.day}
            </Text>
            <Text style={[styles.scheduleTitle, { color: palette.text }]}>
              {item.title}
            </Text>
            <View style={styles.inlineMeta}>
              <Clock3 color={palette.subtext} size={16} />
              <Text style={[styles.cardBody, { color: palette.subtext }]}>
                {item.time} · {item.kind}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
function ProfileScreen({ user, onDetails, onHistory, onAccessibility, onLogout, palette }) {
  return (
    <View style={styles.gap}>
      <View style={styles.profileTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={[styles.profileName, { color: palette.text }]}>
          {user.name}
        </Text>
        <Text style={[styles.cardBody, { color: palette.subtext }]}>
          {user.email}
        </Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Plano ativo</Text>
        </View>
      </View>
      <View
        style={[
          styles.menuCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <MenuRow icon={UserRound} label="Meus dados" onPress={onDetails} palette={palette} />
        <MenuRow icon={Clock3} label="Meu histórico" onPress={onHistory} palette={palette} />
        <MenuRow
          icon={Eye}
          label="Configurações de acessibilidade"
          onPress={onAccessibility}
          palette={palette}
        />
        <MenuRow
          icon={ShieldCheck}
          label="Dados salvos na nuvem (Firebase)"
          onPress={()=>Alert.alert('Seus dados','Seu perfil, treinos, histórico e preferências ficam salvos com segurança no Firebase e podem ser acessados em qualquer aparelho.')}
          palette={palette}
          last
        />
      </View>
      <SecondaryButton label="Sair da conta" onPress={onLogout} />
      <Text style={[styles.versionText, { color: palette.subtext }]}>
        Movi60 versão 1.0.0
      </Text>
    </View>
  )
}
function AccessibilityScreen({
  value,
  onChange,
  onBack,
  palette,
  onboarding = false,
}) {
  const [section, setSection] = useState("main")
  const options = [
    {
      key: "highContrast",
      title: "Alto contraste",
      text: "Deixa textos e contornos mais destacados.",
    },
    {
      key: "largeButtons",
      title: "Botões maiores",
      text: "Aumenta as áreas de toque.",
    },
    {
      key: "simpleLanguage",
      title: "Linguagem simplificada",
      text: "Usa orientações mais diretas.",
    },
  ]
  if (section === "scale") {
    return (
      <>
        <BackHeader
          title="Escala da interface"
          onBack={() => setSection("main")}
          palette={palette}
        />
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
            Escolha o tamanho dos textos e dos ícones. A prévia muda na hora.
          </Text>
          <ChoiceSection
            title="Tamanho dos ícones"
            values={["small", "medium", "large"]}
            selected={value.iconSize}
            onSelect={(iconSize) => onChange({ ...value, iconSize })}
            palette={palette}
            kind="icon"
          />
          <ChoiceSection
            title="Tamanho dos textos"
            values={["small", "medium", "large"]}
            selected={value.textSize}
            onSelect={(textSize) => onChange({ ...value, textSize })}
            palette={palette}
            kind="text"
          />
        </ScrollView>
      </>
    )
  }
  if (section === "font") {
    return (
      <>
        <BackHeader
          title="Fonte"
          onBack={() => setSection("main")}
          palette={palette}
        />
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
            Escolha a fonte que deixa a leitura mais confortável.
          </Text>
          <FontChoice
            title="Fonte padrão"
            text="Clara e familiar, usada normalmente no aplicativo."
            selected={value.fontFamily === "default"}
            onPress={() => onChange({ ...value, fontFamily: "default" })}
            palette={palette}
          />
          <FontChoice
            title="Fonte monoespaçada"
            text="Letras com espaçamento uniforme, uma opção para pessoas com dislexia."
            selected={value.fontFamily === "mono"}
            onPress={() => onChange({ ...value, fontFamily: "mono" })}
            palette={palette}
            mono
          />
        </ScrollView>
      </>
    )
  }
  return (
    <>
      <BackHeader
        title={onboarding ? "Configure do seu jeito" : "Acessibilidade"}
        onBack={onBack}
        palette={palette}
      />
      <ScrollView contentContainerStyle={styles.screenContent}>
        {onboarding && (
          <Text style={[styles.onboardingEyebrow, { color: palette.primary }]}>
            BEM-VINDO AO MOVI60
          </Text>
        )}
        <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
          {onboarding
            ? "Antes de começar, ajuste a leitura e os ícones para ficarem confortáveis para você."
            : "Ajuste o aplicativo para ficar mais confortável para você."}
        </Text>
        <Pressable
          style={[
            styles.accessMenuRow,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
          onPress={() => setSection("scale")}
        >
          <View style={styles.accessMenuIcon}>
            <Activity
              color={COLORS.blue}
              size={26 * (ACCESS_SCALE[value.iconSize] ?? 1)}
            />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.settingTitle, { color: palette.text }]}>
              Escala da interface
            </Text>
            <Text style={[styles.settingText, { color: palette.subtext }]}>
              Tamanhos de ícone e de texto
            </Text>
          </View>
          <ChevronRight color={palette.subtext} size={24} />
        </Pressable>
        <Pressable
          style={[
            styles.accessMenuRow,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
          onPress={() => setSection("font")}
        >
          <View style={styles.fontPreview}>
            <Text style={styles.fontPreviewText}>Aa</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.settingTitle, { color: palette.text }]}>
              Fonte
            </Text>
            <Text style={[styles.settingText, { color: palette.subtext }]}>
              {value.fontFamily === "mono" ? "Monoespaçada" : "Padrão"}
            </Text>
          </View>
          <ChevronRight color={palette.subtext} size={24} />
        </Pressable>
        {options.map((option) => (
          <View
            key={option.key}
            style={[
              styles.settingRow,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.settingTitle, { color: palette.text }]}>
                {option.title}
              </Text>
              <Text style={[styles.settingText, { color: palette.subtext }]}>
                {option.text}
              </Text>
            </View>
            <Switch
              value={value[option.key]}
              onValueChange={(enabled) =>
                onChange({ ...value, [option.key]: enabled })
              }
              trackColor={{ false: COLORS.border, true: COLORS.blue }}
              thumbColor={COLORS.white}
              accessibilityLabel={option.title}
            />
          </View>
        ))}
        <View style={styles.accessTip}>
          <Eye color={COLORS.blue} size={26} />
          <Text style={styles.accessTipText}>
            As alterações são salvas automaticamente neste aparelho.
          </Text>
        </View>
        {onboarding && (
          <PrimaryButton
            label="Salvar e começar"
            icon={Check}
            onPress={onBack}
          />
        )}
      </ScrollView>
    </>
  )
}
function ChoiceSection({ title, values, selected, onSelect, palette, kind }) {
  const labels = { small: "Pequeno", medium: "Padrão", large: "Grande" }
  return (
    <View style={styles.choiceSection}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        {title}
      </Text>
      <View style={styles.choiceGrid}>
        {values.map((item) => {
          const active = selected === item
          return (
            <Pressable
              key={item}
              style={[
                styles.choiceCard,
                {
                  backgroundColor: palette.card,
                  borderColor: active ? palette.primary : palette.border,
                },
              ]}
              onPress={() => onSelect(item)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <View style={styles.choiceExample}>
                {kind === "icon" ? (
                  <Dumbbell
                    color={active ? palette.primary : palette.subtext}
                    size={28 * ACCESS_SCALE[item]}
                  />
                ) : (
                  <NativeText
                    style={[
                      styles.choiceLetters,
                      {
                        color: active ? palette.primary : palette.text,
                        fontSize: 20 * ACCESS_SCALE[item],
                      },
                    ]}
                  >
                    Aa
                  </NativeText>
                )}
              </View>
              <Text
                style={[
                  styles.choiceLabel,
                  { color: active ? palette.primary : palette.text },
                ]}
              >
                {labels[item]}
              </Text>
              <View
                style={[
                  styles.radio,
                  { borderColor: active ? palette.primary : palette.border },
                ]}
              >
                {active && (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: palette.primary },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
function FontChoice({ title, text, selected, onPress, palette, mono = false }) {
  const fontFamily = mono
    ? Platform.select({
        ios: "Courier New",
        android: "monospace",
        web: "ui-monospace, SFMono-Regular, Menlo, monospace",
      })
    : undefined
  return (
    <Pressable
      style={[
        styles.fontChoice,
        {
          backgroundColor: palette.card,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <NativeText
        style={[styles.fontChoiceSample, { color: palette.text, fontFamily }]}
      >
        Movi60
      </NativeText>
      <View style={styles.flex}>
        <NativeText
          style={[styles.settingTitle, { color: palette.text, fontFamily }]}
        >
          {title}
        </NativeText>
        <NativeText
          style={[styles.settingText, { color: palette.subtext, fontFamily }]}
        >
          {text}
        </NativeText>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? palette.primary : palette.border },
        ]}
      >
        {selected && (
          <View
            style={[styles.radioDot, { backgroundColor: palette.primary }]}
          />
        )}
      </View>
    </Pressable>
  )
}
function AssistantScreen({ exercise, onBack, palette }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Olá! Sou o Assistente Movi60. Posso explicar seus exercícios de forma simples. Como posso ajudar?",
    },
  ])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const suggestions = [
    "Como faço a cadeira extensora?",
    "Para que serve o Leg Press?",
    "Quais cuidados devo ter?",
  ]
  const send = async (text = question) => {
    if (!text.trim() || loading) return
    setMessages((items) => [...items, { from: "user", text }])
    setQuestion("")
    setLoading(true)
    const answer = await askAssistant(text,exercise,messages)
    setMessages((items) => [...items, { from: "bot", text: answer }])
    setLoading(false)
  }
  return (
    <>
      <BackHeader title="Assistente Movi60" onBack={onBack} palette={palette} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((message, index) => (
          <View
            key={`${message.from}-${index}`}
            style={[
              styles.bubble,
              message.from === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            {message.from === "bot" && <Bot color={COLORS.blue} size={20} />}
            <Text
              style={
                message.from === "user"
                  ? styles.userBubbleText
                  : styles.botBubbleText
              }
            >
              {message.text}
            </Text>
          </View>
        ))}
        {loading && <ActivityIndicator color={COLORS.blue} />}
        {messages.length === 1 &&
          suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              style={styles.suggestion}
              onPress={() => void send(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        <View style={styles.disclaimer}>
          <ShieldCheck color={COLORS.slate} size={18} />
          <Text style={styles.disclaimerText}>
            Respostas geradas por inteligência artificial (Gemini, via Firebase). Podem conter erros e não substituem a orientação do professor ou profissional de saúde.
          </Text>
        </View>
      </ScrollView>
      <View
        style={[
          styles.chatInputRow,
          { borderColor: palette.border, backgroundColor: palette.card },
        ]}
      >
        <TextInput
          style={[styles.chatInput, { color: palette.text }]}
          value={question}
          onChangeText={setQuestion}
          placeholder="Digite sua dúvida..."
          placeholderTextColor={palette.subtext}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={() => void send()}>
          <ChevronRight color={COLORS.white} size={26} />
        </Pressable>
      </View>
    </>
  )
}
function StaffApp({user,tab,onTab,exercises,workouts,people,history,onAddExercise,onEditExercise,onDeleteExercise,onWorkout,onEditWorkout,onDeleteWorkout,onPerson,onNewUser,onAssign,onAccessibility,onProfileDetails,onLogout,palette}) {
 const admin=user.role==='admin';
 const myStudents=people.filter(p=>p.role==='student'&&p.instructorId===user.id);
 const mine=admin ? workouts : workouts.filter(w=>w.professionalId===user.id || (!w.professionalId&&w.professional===user.name));
 const titles={dashboard:admin?'Painel do Administrador':'Painel do Professor',people:admin?'Usuários e vínculos':'Meus alunos',workouts:'Meus treinos',exercises:'Gerenciar exercícios',profile:'Meu perfil'};
 return <>
  <ScreenHeader title={titles[tab]||titles.dashboard} subtitle={tab==='dashboard'?`Olá, ${user.name.split(' ')[0]}`:undefined} palette={palette}/>
  <ScrollView style={styles.flex} contentContainerStyle={styles.screenContent}>
   {tab==='dashboard'&&<StaffDashboard admin={admin} user={user} people={people} workouts={workouts} exercises={exercises} onNavigate={onTab} onNewUser={onNewUser} onAssign={onAssign} palette={palette}/>}
   {tab==='people'&&<PeopleList admin={admin} user={user} people={people} onPerson={onPerson} onNewUser={onNewUser} onAssign={onAssign} palette={palette}/>}
   {tab==='exercises'&&<ExerciseManager exercises={exercises} onAdd={onAddExercise} onEdit={onEditExercise} onDelete={onDeleteExercise} palette={palette}/>}
   {tab==='workouts'&&<WorkoutManager workouts={mine} onAdd={onWorkout} onEdit={onEditWorkout} onDelete={onDeleteWorkout} palette={palette}/>}
   {tab==='profile'&&<ProfileScreen user={user} onDetails={onProfileDetails} onHistory={()=>onTab('dashboard')} onAccessibility={onAccessibility} onLogout={onLogout} palette={palette}/>}
  </ScrollView>
  <StaffNav active={tab} onChange={onTab} admin={admin} palette={palette}/>
 </>;
}
function StaffDashboard({ admin, user, people, workouts, exercises, onNavigate, onNewUser, onAssign, palette }) {
  const students=people.filter(p=>p.role==='student');
  const teachers=people.filter(p=>p.role==='instructor');
  const mine=students.filter(p=>p.instructorId===user.id);
  const myWorkouts=workouts.filter(w=>w.professionalId===user.id || (!w.professionalId&&w.professional===user.name));
  const stats=admin ? [
    [String(students.length),'Alunos'],[String(teachers.length),'Professores'],
    [String(students.filter(p=>!p.instructorId).length),'Sem professor'],[String(workouts.length),'Treinos cadastrados']
  ] : [
    [String(mine.length),'Meus alunos'],[String(myWorkouts.length),'Treinos atribuídos'],
    [String(exercises.length),'Exercícios'],[String(mine.filter(p=>myWorkouts.some(w=>w.studentId===p.id)).length),'Alunos com treino']
  ];
  return <View style={styles.gap}>
    <View style={styles.staffWelcome}>
      <Text style={styles.staffWelcomeTitle}>{admin?'Gestão da academia':'Gestão dos meus treinos'}</Text>
      <Text style={styles.staffWelcomeText}>{admin?'Controle usuários, permissões e vínculos entre alunos e professores.':'Acompanhe os alunos vinculados a você e organize os treinos deles.'}</Text>
    </View>
    <View style={styles.statsGrid}>{stats.map(([value,label])=><View key={label} style={[styles.staffStat,{backgroundColor:palette.card,borderColor:palette.border}]}><Text style={styles.staffStatValue}>{value}</Text><Text style={[styles.staffStatLabel,{color:palette.subtext}]}>{label}</Text></View>)}</View>
    <Text style={[styles.sectionTitle,{color:palette.text}]}>Acesso rápido</Text>
    <QuickAction icon={UsersRound} label={admin?'Gerenciar usuários e permissões':'Meus alunos'} onPress={()=>onNavigate('people')} palette={palette}/>
    {admin ? <>
      <QuickAction icon={Plus} label="Cadastrar usuário" onPress={onNewUser} palette={palette}/>
      <QuickAction icon={ShieldCheck} label="Vincular alunos a professores" onPress={onAssign} palette={palette}/>
      <QuickAction icon={Dumbbell} label="Gerenciar treinos" onPress={()=>onNavigate('workouts')} palette={palette}/>
      <InfoSection title="Escopo do administrador" text="Administre usuários, vínculos e treinos de todos os alunos." palette={palette}/>
    </> : <>
      <QuickAction icon={Dumbbell} label="Gerenciar meus treinos" onPress={()=>onNavigate('workouts')} palette={palette}/>
      <QuickAction icon={Activity} label="Gerenciar exercícios" onPress={()=>onNavigate('exercises')} palette={palette}/>
      <InfoSection title="Escopo do professor" text="Você pode montar treinos somente para seus alunos vinculados." palette={palette}/>
    </>}
  </View>;
}
function PeopleList({ admin, people, user, onPerson, onNewUser, onAssign, palette }) {
  const [search,setSearch]=useState('');
  const list=people.filter(p=>(admin||p.role==='student'&&p.instructorId===user.id)&&[p.name,p.email].some(v=>(v||'').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))));
  const professors=people.filter(p=>p.role==='instructor');
  return <View style={styles.gap}>
    {admin&&<PrimaryButton label="Cadastrar usuário" icon={Plus} onPress={onNewUser}/>}
    {admin&&<SecondaryButton label="Vincular alunos a professores" icon={ShieldCheck} onPress={onAssign}/>}
    <Field label="Buscar por nome ou e-mail" value={search} onChangeText={setSearch} placeholder={admin?'Buscar usuário':'Buscar meus alunos'} icon={UsersRound}/>
    <Text style={[styles.listCount,{color:palette.subtext}]}>{list.length} {admin?'usuário(s)':'aluno(s) vinculado(s)'}</Text>
    {list.map(person=><Pressable key={person.id} style={[styles.personCard,{backgroundColor:palette.card,borderColor:palette.border}]} onPress={()=>onPerson(person)}>
      <View style={styles.personAvatar}><Text style={styles.personAvatarText}>{initials(person.name)}</Text></View>
      <View style={styles.flex}><Text style={[styles.exerciseTitle,{color:palette.text}]}>{person.name}</Text><Text style={[styles.exerciseGroup,{color:palette.subtext}]}>{roleLabels[person.role]||person.role} · {person.email}</Text>
      {person.role==='student'&&<Text style={[styles.cardBody,{color:palette.subtext}]}>Professor: {professors.find(p=>p.id===person.instructorId)?.name||'Não vinculado'}</Text>}</View><ChevronRight color={palette.subtext} size={24}/>
    </Pressable>)}
    {!list.length&&<Text style={[styles.cardBody,{color:palette.subtext}]}>{admin?'Nenhum usuário encontrado.':'Nenhum aluno vinculado a você. Peça ao administrador para realizar os vínculos.'}</Text>}
  </View>;
}
function PersonDetail({person,history=[],people=[],onSave,onDelete,admin,self,onBack,palette}) {
 const [name,setName]=useState(person.name); const [email,setEmail]=useState(person.email); const [role,setRole]=useState(person.role);
 const [instructorId,setInstructorId]=useState(person.instructorId||''); const [editing,setEditing]=useState(false); const [error,setError]=useState('');
 const instructors=people.filter(p=>p.role==='instructor'&&p.id!==person.id);
 const save=()=>{if(!name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return setError('Informe nome e e-mail válidos.');
   onSave({...person,name:name.trim(),email:email.trim().toLowerCase(),role,instructorId:role==='student'?instructorId:''});};
 return <><BackHeader title={self?'Meus dados':admin?'Gerenciar usuário':'Detalhes do aluno'} onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent}>
  <View style={styles.profileTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(name)}</Text></View><Text style={[styles.profileName,{color:palette.text}]}>{name}</Text><Text style={[styles.cardBody,{color:palette.subtext}]}>{email}</Text></View>
  {editing?<>
    <Field label="Nome" value={name} onChangeText={setName}/><Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address"/>
    {admin&&<><Text style={[styles.sectionTitle,{color:palette.text}]}>Permissão do usuário</Text><View style={styles.roleRow}>{['student','instructor','admin'].map(r=><Pressable key={r} style={[styles.roleChip,role===r&&styles.roleChipActive]} onPress={()=>setRole(r)}><Text style={[styles.roleChipText,role===r&&styles.roleChipTextActive]}>{roleLabels[r]}</Text></Pressable>)}</View></>}
    {admin&&role==='student'&&<><Text style={[styles.sectionTitle,{color:palette.text}]}>Professor responsável</Text><View style={styles.roleRow}><Pressable style={[styles.roleChip,!instructorId&&styles.roleChipActive]} onPress={()=>setInstructorId('')}><Text style={[styles.roleChipText,!instructorId&&styles.roleChipTextActive]}>Sem professor</Text></Pressable>{instructors.map(p=><Pressable key={p.id} style={[styles.roleChip,instructorId===p.id&&styles.roleChipActive]} onPress={()=>setInstructorId(p.id)}><Text style={[styles.roleChipText,instructorId===p.id&&styles.roleChipTextActive]}>{p.name}</Text></Pressable>)}</View></>}
    {!!error&&<Text style={styles.formMessage}>{error}</Text>}
    <PrimaryButton label="Salvar alterações" onPress={save}/><SecondaryButton label="Cancelar" onPress={()=>setEditing(false)}/>
   </>:<>
    <InfoSection title="Perfil" text={roleLabels[role]||role} palette={palette}/>
    {role==='student'&&<InfoSection title="Professor responsável" text={people.find(p=>p.id===person.instructorId)?.name||'Não vinculado'} palette={palette}/>}
    {role==='student'&&<InfoSection title="Atividades registradas" text={`${history.length} exercício(s) concluído(s)`} palette={palette}/>}
    {(self||admin)&&<PrimaryButton label={admin?'Editar usuário e vínculo':'Editar informações'} icon={Pencil} onPress={()=>setEditing(true)}/>}
    {admin&&!self&&<SecondaryButton label="Excluir usuário" icon={Trash2} onPress={onDelete}/>}
   </>}
 </ScrollView></>;
}
function AssignStudentsScreen({people,onAssign,onBack,palette}) {
 const [search,setSearch]=useState(''); const [onlyUnassigned,setOnlyUnassigned]=useState(false); const [busyId,setBusyId]=useState('');
 const instructors=people.filter(p=>p.role==='instructor');
 const term=search.toLocaleLowerCase('pt-BR');
 const students=people.filter(p=>p.role==='student'&&(!onlyUnassigned||!p.instructorId)&&[p.name,p.email].some(v=>(v||'').toLocaleLowerCase('pt-BR').includes(term)));
 const assign=async(student,instructorId)=>{if(busyId||student.instructorId===instructorId)return;setBusyId(student.id);try{await onAssign(student,instructorId);}finally{setBusyId('');}};
 return <><BackHeader title="Vincular alunos a professores" onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
  <Text style={[styles.cardBody,{color:palette.subtext}]}>Toque no nome do professor para vincular o aluno. O vínculo é salvo na hora.</Text>
  <Field label="Buscar aluno" value={search} onChangeText={setSearch} placeholder="Nome ou e-mail do aluno" icon={UsersRound}/>
  <View style={styles.roleRow}>
   <Pressable style={[styles.roleChip,!onlyUnassigned&&styles.roleChipActive]} onPress={()=>setOnlyUnassigned(false)}><Text style={[styles.roleChipText,!onlyUnassigned&&styles.roleChipTextActive]}>Todos</Text></Pressable>
   <Pressable style={[styles.roleChip,onlyUnassigned&&styles.roleChipActive]} onPress={()=>setOnlyUnassigned(true)}><Text style={[styles.roleChipText,onlyUnassigned&&styles.roleChipTextActive]}>Sem professor</Text></Pressable>
  </View>
  {!instructors.length&&<InfoSection title="Nenhum professor cadastrado" text="Cadastre um usuário com o perfil Professor para poder fazer vínculos." palette={palette}/>}
  <Text style={[styles.listCount,{color:palette.subtext}]}>{students.length} aluno(s)</Text>
  {students.map(student=><View key={student.id} style={[styles.personCard,{backgroundColor:palette.card,borderColor:palette.border,flexDirection:'column',alignItems:'stretch',gap:10}]}>
   <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    <View style={styles.personAvatar}><Text style={styles.personAvatarText}>{initials(student.name)}</Text></View>
    <View style={styles.flex}><Text style={[styles.exerciseTitle,{color:palette.text}]}>{student.name}</Text><Text style={[styles.exerciseGroup,{color:palette.subtext}]}>{busyId===student.id?'Salvando...':`Professor: ${instructors.find(p=>p.id===student.instructorId)?.name||'Não vinculado'}`}</Text></View>
   </View>
   <View style={styles.roleRow}>
    <Pressable disabled={!!busyId} style={[styles.roleChip,!student.instructorId&&styles.roleChipActive]} onPress={()=>void assign(student,'')}><Text style={[styles.roleChipText,!student.instructorId&&styles.roleChipTextActive]}>Sem professor</Text></Pressable>
    {instructors.map(p=><Pressable key={p.id} disabled={!!busyId} style={[styles.roleChip,student.instructorId===p.id&&styles.roleChipActive]} onPress={()=>void assign(student,p.id)}><Text style={[styles.roleChipText,student.instructorId===p.id&&styles.roleChipTextActive]}>{p.name}</Text></Pressable>)}
   </View>
  </View>)}
  {!students.length&&<Text style={[styles.cardBody,{color:palette.subtext}]}>Nenhum aluno encontrado. Se você esperava ver alunos aqui, confira se as regras do Firestore foram publicadas.</Text>}
 </ScrollView></>;
}
function CreateUserScreen({people,onSave,onBack,palette}) {
 const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [role,setRole]=useState('student'); const [instructorId,setInstructorId]=useState('');const [error,setError]=useState('');
 const submit=async()=>{const msg=await onSave({name,email,role,instructorId});if(msg)setError(msg);};
 return <><BackHeader title="Cadastrar usuário" onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
  <Field label="Nome completo" value={name} onChangeText={setName}/><Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address"/>
  <Text style={[styles.sectionTitle,{color:palette.text}]}>Perfil</Text><View style={styles.roleRow}>{['student','instructor','admin'].map(r=><Pressable key={r} style={[styles.roleChip,role===r&&styles.roleChipActive]} onPress={()=>setRole(r)}><Text style={[styles.roleChipText,role===r&&styles.roleChipTextActive]}>{roleLabels[r]}</Text></Pressable>)}</View>
  {role==='student'&&<><Text style={[styles.sectionTitle,{color:palette.text}]}>Professor responsável</Text><View style={styles.roleRow}><Pressable style={[styles.roleChip,!instructorId&&styles.roleChipActive]} onPress={()=>setInstructorId('')}><Text style={[styles.roleChipText,!instructorId&&styles.roleChipTextActive]}>Sem professor</Text></Pressable>{people.filter(p=>p.role==='instructor').map(p=><Pressable key={p.id} style={[styles.roleChip,instructorId===p.id&&styles.roleChipActive]} onPress={()=>setInstructorId(p.id)}><Text style={[styles.roleChipText,instructorId===p.id&&styles.roleChipTextActive]}>{p.name}</Text></Pressable>)}</View></>}
  <Text style={[styles.cardBody,{color:palette.subtext}]}>A nova conta receberá a senha inicial 123456. Oriente o usuário a trocá-la pelo "Esqueci minha senha".</Text>
  {!!error&&<Text style={styles.formMessage}>{error}</Text>}<PrimaryButton label="Cadastrar usuário" icon={Plus} onPress={()=>void submit()}/>
 </ScrollView></>;
}
function ExerciseManager({ exercises, onAdd, onEdit, onDelete, palette }) {
  return (
    <View style={styles.gap}>
      <PrimaryButton label="Cadastrar exercício" icon={Plus} onPress={onAdd} />
      <Text style={[styles.listCount, { color: palette.subtext }]}>
        {exercises.length} exercícios cadastrados
      </Text>
      {exercises.map((exercise) => (
        <View
          key={exercise.id}
          style={[
            styles.manageCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.manageIcon}>
            <Dumbbell color={COLORS.blue} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.exerciseTitle, { color: palette.text }]}>
              {exercise.name}
            </Text>
            <Text style={[styles.exerciseGroup, { color: palette.subtext }]}>
              {exercise.group} · {exercise.sets} séries
            </Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={() => onEdit(exercise)}
            accessibilityLabel={`Editar ${exercise.name}`}
          >
            <Pencil color={COLORS.blue} size={21} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => onDelete(exercise.id)}
            accessibilityLabel={`Excluir ${exercise.name}`}
          >
            <Trash2 color={COLORS.red} size={21} />
          </Pressable>
        </View>
      ))}
    </View>
  )
}
function WorkoutManager({ workouts, onAdd, onEdit, onDelete, palette }) {
  return (
    <View style={styles.gap}>
      <PrimaryButton label="Criar novo treino" icon={Plus} onPress={onAdd} />
      <Text style={[styles.listCount, { color: palette.subtext }]}>
        {workouts.length} treinos ativos
      </Text>
      {workouts.map((workout) => (
        <View
          key={workout.id}
          style={[
            styles.manageWorkout,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <Text style={[styles.exerciseTitle, { color: palette.text }]}>
                {workout.name}
              </Text>
              <Text style={[styles.exerciseGroup, { color: palette.subtext }]}>
                {workout.student}
              </Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Ativo</Text>
            </View>
          </View>
          <Text style={[styles.cardBody, { color: palette.subtext }]}>
            {workout.exercises.length} exercícios · Prof.{" "}
            {workout.professional}
          </Text>
          <View style={styles.cardActions}>
            <Pressable style={styles.smallAction} onPress={()=>onEdit(workout)}>
              <Pencil color={COLORS.blue} size={18} />
              <Text style={styles.smallActionText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.smallAction} onPress={()=>onDelete(workout.id)}>
              <Trash2 color={COLORS.red} size={18} />
              <Text style={styles.deleteText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  )
}
function ExerciseForm({ value, onSave, onBack, palette }) {
  const [name, setName] = useState(value?.name ?? "")
  const [group, setGroup] = useState(value?.group ?? "")
  const [description, setDescription] = useState(value?.description ?? "")
  const [instructions, setInstructions] = useState(value?.instructions ?? "")
  const [sets, setSets] = useState(String(value?.sets ?? 3))
  const [reps, setReps] = useState(value?.reps ?? "12 repetições")
  const [image,setImage]=useState(value?.image??'');
  const [care,setCare]=useState(value?.care??'');
  const [error, setError] = useState("")
  const submit = () => {
    if (!name || !group || !instructions)
      return setError("Preencha nome, grupo muscular e instruções.")
    onSave({
      id: value?.id ?? `e${Date.now()}`,
      name,
      group,
      description,
      instructions,
      image:image.trim(),care:care.trim(),
      sets: Number(sets) || 1,
      reps,
    })
  }
  return (
    <>
      <BackHeader
        title={value ? "Editar exercício" : "Cadastrar exercício"}
        onBack={onBack}
        palette={palette}
      />
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Elevação de calcanhares"
        />
        <Field
          label="Grupo muscular"
          value={group}
          onChangeText={setGroup}
          placeholder="Ex.: Pernas"
        />
        <Field
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Descrição simples do exercício"
        />
        <Field
          label="Instruções"
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Explique como realizar com segurança"
        />
        <Field label="Imagem (URL opcional)" value={image} onChangeText={setImage} placeholder="https://..."/>
        <Field label="Observações / cuidados" value={care} onChangeText={setCare} multiline placeholder="Ex.: evite travar os joelhos"/>
        <View style={styles.formColumns}>
          <View style={styles.flex}>
            <Field
              label="Séries"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Repetições/tempo"
              value={reps}
              onChangeText={setReps}
            />
          </View>
        </View>
        {!!error && <Text style={styles.formMessage}>{error}</Text>}
        <PrimaryButton label="Salvar exercício" icon={Check} onPress={submit} />
      </ScrollView>
    </>
  )
}
function WorkoutForm({ value, exercises, people, professional, onSave, onBack, palette }) {
  const [name,setName]=useState(value?.name||'');
  const [student,setStudent]=useState(value?.student||'');
  const [studentId,setStudentId]=useState(value?.studentId||'');
  const [notes,setNotes]=useState(value?.notes||'');
  const [date,setDate]=useState(value?.date||new Date().toLocaleDateString('sv-SE'));
  const [duration,setDuration]=useState(value?.duration||'35 minutos');
  const [selected,setSelected]=useState(value?.exercises||[]);
  const [prescriptions,setPrescriptions]=useState(value?.prescriptions||{});
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(saving) return;
    setError('');
    if(!name.trim()||!studentId||!people.some(p=>p.id===studentId)||selected.length===0) return setError('Informe um nome, selecione um aluno vinculado e ao menos um exercício.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Use a data no formato AAAA-MM-DD.');
    setSaving(true);
    try {
      const result=await onSave({id:value?.id||`w${Date.now()}`,name:name.trim(),student:student.trim(),studentId,notes,date,duration,exercises:selected,professional:professional?.name||value?.professional||'',professionalId:professional?.id||value?.professionalId||'',prescriptions});
      if(result!==true) setError(typeof result==='string'?result:'Não foi possível salvar o treino. Confira os dados e tente novamente.');
    } catch (saveError) {
      setError(saveError?.message||'Ocorreu um erro ao salvar o treino.');
    } finally {
      setSaving(false);
    }
  };
  return <><BackHeader title={value?'Editar treino':'Criar treino'} onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
    <Field label="Nome do treino" value={name} onChangeText={setName} placeholder="Ex.: Treino C — Equilíbrio"/>
    <Text style={[styles.cardBody,{color:palette.subtext}]}>Aluno que receberá este treino:</Text>
    {people.filter(p=>p.role==='student').length===0 ? (
      <View style={{padding:14,borderWidth:1,borderColor:palette.border,borderRadius:12,backgroundColor:palette.card,gap:6}}>
        <Text style={{fontWeight:'700',color:palette.text}}>Nenhum aluno vinculado</Text>
        <Text style={{color:palette.subtext,lineHeight:20}}>Seu perfil de professor ainda não tem alunos vinculados. Peça ao administrador para vincular um aluno ao seu cadastro no Firebase, preenchendo o campo instructorId com o ID da sua conta.</Text>
      </View>
    ) : (
      <View style={styles.roleRow}>{people.filter(p=>p.role==='student').map(p=><Pressable key={p.id} onPress={()=>{setStudent(p.name);setStudentId(p.id)}} style={[styles.roleChip,studentId===p.id&&styles.roleChipActive]}><Text style={[styles.roleChipText,studentId===p.id&&styles.roleChipTextActive]}>{p.name}</Text></Pressable>)}</View>
    )}
    <Field label="Data (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-11-08"/>
    <Field label="Duração" value={duration} onChangeText={setDuration} placeholder="35 minutos"/>
    <Field label="Observações" value={notes} onChangeText={setNotes} multiline placeholder="Orientações do treino"/>
    <Text style={[styles.sectionTitle,{color:palette.text}]}>Exercícios e séries</Text>
    {exercises.map(ex=>{const checked=selected.includes(ex.id);const preset=prescriptions[ex.id]||{sets:ex.sets,reps:ex.reps};return <View key={ex.id} style={{gap:8}}>
      <Pressable style={[styles.selectExercise,{borderColor:checked?COLORS.blue:palette.border,backgroundColor:palette.card}]} onPress={()=>setSelected(checked?selected.filter(id=>id!==ex.id):[...selected,ex.id])}>
        <View style={[styles.checkbox,checked&&styles.checkboxChecked]}>{checked&&<Check color={COLORS.white} size={18}/>}</View><Text style={[styles.historyTitle,{color:palette.text}]}>{ex.name}</Text>
      </Pressable>
      {checked&&<View style={{flexDirection:'row',gap:10,marginHorizontal:12}}><View style={{flex:1}}><Field label="Séries" keyboardType="numeric" value={String(preset.sets)} onChangeText={v=>setPrescriptions(old=>({...old,[ex.id]:{...preset,sets:Number(v)||1}}))}/></View><View style={{flex:2}}><Field label="Repetições / tempo" value={String(preset.reps)} onChangeText={v=>setPrescriptions(old=>({...old,[ex.id]:{...preset,reps:v}}))}/></View></View>}
    </View>})}
    {!!error&&<Text style={styles.formMessage}>{error}</Text>}
    <PrimaryButton label={saving?'Salvando...':value?'Atualizar treino':'Salvar treino'} icon={Check} onPress={save} disabled={saving}/>
  </ScrollView></>;
}

function ExecutionScreen({exercise,onBack,onRegister,palette}) {
  const [stage,setStage]=useState(1);
  const steps=(exercise.instructions||'Realize o exercício conforme a orientação do professor.').split(/(?<=\.)\s+/).filter(Boolean);
  return <><BackHeader title="Execução do treino" onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent}>
    <Text style={[styles.detailTitle,{color:palette.text}]}>{exercise.name}</Text>
    <Text style={[styles.detailGroup,{marginBottom:10}]}>{exercise.sets} séries · {exercise.reps}</Text>
    <View style={styles.exerciseIllustration}><Dumbbell size={58} color={COLORS.blue}/></View>
    <Text style={[styles.sectionTitle,{color:palette.text}]}>Passo {stage} de {steps.length}</Text>
    <View style={[styles.summaryCard,{backgroundColor:palette.card,borderColor:palette.border}]}><Text style={[styles.infoText,{color:palette.text}]}>{steps[stage-1]}</Text></View>
    {stage<steps.length?<PrimaryButton label="Próximo passo" onPress={()=>setStage(n=>n+1)}/>:<PrimaryButton label="Registrar exercício" icon={Check} onPress={onRegister}/>}
    <SecondaryButton label="Registrar agora" onPress={onRegister}/>
  </ScrollView></>;
}
function RegistrationScreen({exercise,onBack,onSave,palette}) {
  const [sets,setSets]=useState(String(exercise.sets));const [reps,setReps]=useState(String(exercise.reps));const [load,setLoad]=useState('');const [notes,setNotes]=useState('');const [error,setError]=useState('');
  const submit=()=>{if(!sets.trim()||!reps.trim()||Number(sets)<1)return setError('Informe as séries e as repetições realizadas.');onSave({sets:Number(sets),reps,load,notes})};
  return <><BackHeader title="Registro do exercício" onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
    <Text style={[styles.detailTitle,{color:palette.text}]}>{exercise.name}</Text>
    <Field label="Séries realizadas" value={sets} onChangeText={setSets} keyboardType="numeric"/>
    <Field label="Repetições / duração" value={reps} onChangeText={setReps}/>
    <Field label="Carga utilizada em kg (opcional)" value={load} onChangeText={setLoad} keyboardType="decimal-pad" placeholder="Ex.: 5"/>
    <Field label="Observações" value={notes} onChangeText={setNotes} multiline placeholder="Como foi o exercício?"/>
    {!!error&&<Text style={styles.formMessage}>{error}</Text>}
    <PrimaryButton label="Salvar registro" icon={Check} onPress={submit}/>
  </ScrollView></>;
}
function FinishedScreen({onBack,onHistory,palette}) {return <><BackHeader title="Treino concluído" onBack={onBack} palette={palette}/><View style={[styles.screenContent,{alignItems:'center',gap:18}]}><Check color={COLORS.green} size={72}/><Text style={[styles.detailTitle,{color:palette.text}]}>Parabéns!</Text><Text style={[styles.heroSubtitle,{color:palette.subtext,textAlign:'center'}]}>Seus exercícios foram registrados neste dispositivo.</Text><PrimaryButton label="Ver histórico" onPress={onHistory}/><SecondaryButton label="Voltar ao treino" onPress={onBack}/></View></>}
function HistoryScreen({history,onBack,palette}){return <><BackHeader title="Histórico" onBack={onBack} palette={palette}/><ScrollView contentContainerStyle={styles.screenContent}>
  <Text style={[styles.sectionTitle,{color:palette.text}]}>{history.length} exercícios registrados</Text>
  {history.length===0?<Text style={[styles.infoText,{color:palette.subtext}]}>Nenhuma atividade registrada ainda.</Text>:history.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(h=><View key={h.id} style={[styles.summaryCard,{backgroundColor:palette.card,borderColor:palette.border,marginBottom:12}]}><Text style={[styles.exerciseTitle,{color:palette.text}]}>{h.exerciseName}</Text><Text style={[styles.cardBody,{color:palette.subtext}]}>{h.workoutName} · {new Date(h.date).toLocaleString('pt-BR')}</Text><Text style={[styles.cardBody,{color:palette.text}]}>{h.sets} séries · {h.reps} {h.load?`· ${h.load} kg`:''}</Text>{h.notes?<Text style={[styles.cardBody,{color:palette.subtext}]}>{h.notes}</Text>:null}</View>)}
 </ScrollView></>}
const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
