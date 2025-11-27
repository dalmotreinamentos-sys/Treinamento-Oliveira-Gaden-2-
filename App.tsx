import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Leaf, 
  PlayCircle, 
  BookOpen, 
  Trophy, 
  BarChart, 
  ArrowLeft, 
  Sun, 
  CloudSun, 
  Cloud, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Clock,
  Menu,
  X,
  Camera,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Plant, LightRequirement, UserProgress, QuizQuestion, StudySession } from './types';
import { PLANT_DATABASE } from './constants';

// --- Services & Helpers ---

const PROGRESS_KEY = 'oliveira_garden_progress_v1';
const CUSTOM_IMAGES_KEY = 'oliveira_garden_custom_images_v1';

const getInitialProgress = (): UserProgress => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (stored) return JSON.parse(stored);
  return {
    plantsStudiedCount: 0,
    lastStudyDate: null,
    streakDays: 0,
    quizTotalQuestions: 0,
    quizCorrectAnswers: 0,
    history: []
  };
};

const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Helper to compress images before saving to avoid LocalStorage quotas
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; // Limit width to 600px
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only resize if bigger than max width
        if (scaleSize < 1) {
             canvas.width = MAX_WIDTH;
             canvas.height = img.height * scaleSize;
        } else {
             canvas.width = img.width;
             canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Compress to JPEG quality 0.7
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Hook to manage plant database with custom overrides
const usePlantDatabase = () => {
  const [plants, setPlants] = useState<Plant[]>(PLANT_DATABASE);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedImages = localStorage.getItem(CUSTOM_IMAGES_KEY);
    if (storedImages) {
      try {
        const parsed = JSON.parse(storedImages);
        setCustomImages(parsed);
      } catch (e) {
        console.error("Failed to parse custom images", e);
      }
    }
  }, []);

  useEffect(() => {
    // Merge base database with custom images
    const mergedPlants = PLANT_DATABASE.map(p => ({
      ...p,
      imageUrl: customImages[p.id] || p.imageUrl
    }));
    setPlants(mergedPlants);
  }, [customImages]);

  const updatePlantImage = async (plantId: string, file: File) => {
    try {
      const base64Image = await compressImage(file);
      const newCustomImages = { ...customImages, [plantId]: base64Image };
      setCustomImages(newCustomImages);
      localStorage.setItem(CUSTOM_IMAGES_KEY, JSON.stringify(newCustomImages));
      return true;
    } catch (e) {
      console.error("Error saving image", e);
      alert("Erro ao salvar imagem. Tente uma foto menor.");
      return false;
    }
  };

  const resetImage = (plantId: string) => {
    const newCustomImages = { ...customImages };
    delete newCustomImages[plantId];
    setCustomImages(newCustomImages);
    localStorage.setItem(CUSTOM_IMAGES_KEY, JSON.stringify(newCustomImages));
  };

  return { plants, updatePlantImage, resetImage };
};

const getRandomPlantsFromList = (sourcePlants: Plant[], count: number): Plant[] => {
  const shuffled = [...sourcePlants].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// --- Components ---

const LightBadge = ({ type }: { type: LightRequirement }) => {
  switch (type) {
    case LightRequirement.FULL_SUN:
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full"><Sun size={12} /> Sol Pleno</span>;
    case LightRequirement.PARTIAL_SHADE:
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"><CloudSun size={12} /> Meia-sombra</span>;
    case LightRequirement.SHADE:
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full"><Cloud size={12} /> Sombra</span>;
    default:
      return null;
  }
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      <header className="sticky top-0 z-50 bg-emerald-700 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Leaf className="text-emerald-300" />
            <span>Treinamento Garden</span>
          </Link>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 md:hidden">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
             <Link to="/" className="hover:text-emerald-200">Início</Link>
             <Link to="/study" className="hover:text-emerald-200">Estudar</Link>
             <Link to="/progress" className="hover:text-emerald-200">Progresso</Link>
          </nav>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-emerald-800 px-4 py-4 space-y-3">
             <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2">Início</Link>
             <Link to="/study" onClick={() => setIsMenuOpen(false)} className="block py-2">Estudar Plantas</Link>
             <Link to="/quiz" onClick={() => setIsMenuOpen(false)} className="block py-2">Quiz do Dia</Link>
             <Link to="/progress" onClick={() => setIsMenuOpen(false)} className="block py-2">Meu Progresso</Link>
          </div>
        )}
      </header>
      <main className="flex-grow w-full max-w-md mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

// --- Pages ---

const HomePage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-emerald-900">Olá, Consultor!</h1>
        <p className="text-emerald-700">Pronto para dominar o jardim?</p>
      </div>
      
      <div className="grid gap-4">
        <Link to="/cycle" className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group">
          <div className="bg-emerald-100 p-4 rounded-full group-hover:bg-emerald-200 transition-colors">
            <Clock className="w-8 h-8 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">Ciclo de 3 Minutos</h3>
            <p className="text-sm text-gray-500">Duas plantas, foco total, rápido e eficiente.</p>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
        </Link>

        <Link to="/study" className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group">
          <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
            <BookOpen className="w-8 h-8 text-blue-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">Estudar Plantas</h3>
            <p className="text-sm text-gray-500">Base completa. <strong>Adicione suas fotos!</strong></p>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
        </Link>

        <Link to="/quiz" className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group">
          <div className="bg-amber-100 p-4 rounded-full group-hover:bg-amber-200 transition-colors">
            <Trophy className="w-8 h-8 text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">Quiz do Dia</h3>
            <p className="text-sm text-gray-500">Teste seu conhecimento com 3 desafios.</p>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
        </Link>

        <Link to="/progress" className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group">
          <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
            <BarChart className="w-8 h-8 text-purple-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">Meu Progresso</h3>
            <p className="text-sm text-gray-500">Acompanhe seus estudos e acertos.</p>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
        </Link>
      </div>
    </div>
  );
};

const CyclePage = () => {
  const { plants } = usePlantDatabase();
  const [sessionPlants, setSessionPlants] = useState<Plant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Initialize cycle
  useEffect(() => {
    if (plants.length > 0) {
      const selected = getRandomPlantsFromList(plants, 2);
      setSessionPlants(selected);
      setIsActive(true);
    }
  }, [plants]); // Depend on plants so if custom image updates, it reflects (though usually we start new session)

  // Timer logic
  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleFinish = useCallback(() => {
    setIsActive(false);
    setIsFinished(true);
    
    // Update Progress
    const currentProgress = getInitialProgress();
    const today = new Date().toISOString().split('T')[0];
    
    // Check streak
    let streak = currentProgress.streakDays;
    if (currentProgress.lastStudyDate) {
      const last = new Date(currentProgress.lastStudyDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) streak++;
      else if (diffDays > 1 && today !== currentProgress.lastStudyDate) streak = 1;
    } else {
      streak = 1;
    }

    const newProgress: UserProgress = {
      ...currentProgress,
      plantsStudiedCount: currentProgress.plantsStudiedCount + sessionPlants.length,
      lastStudyDate: today,
      streakDays: streak,
      history: [...currentProgress.history, { date: today, type: 'CYCLE' }]
    };
    saveProgress(newProgress);
  }, [sessionPlants]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (sessionPlants.length === 0) return <div>Carregando plantas...</div>;

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-fade-in">
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <h2 className="text-2xl font-bold text-gray-800">Ciclo Concluído!</h2>
        <p className="text-center text-gray-600">Você estudou 2 novas plantas hoje. Continue assim!</p>
        <div className="flex gap-4 w-full">
           <Link to="/" className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold text-center hover:bg-gray-300">Voltar</Link>
           <Link to="/quiz" className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-emerald-700">Fazer Quiz</Link>
        </div>
      </div>
    );
  }

  const currentPlant = sessionPlants[currentIndex];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 font-mono font-bold text-xl text-emerald-700">
           <Clock size={20} />
           {formatTime(timeLeft)}
        </div>
        <div className="text-sm font-medium text-gray-500">
          Planta {currentIndex + 1} de {sessionPlants.length}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col flex-grow relative">
         <img 
           src={currentPlant.imageUrl} 
           alt={currentPlant.commonName} 
           className="w-full h-64 object-cover"
         />
         <div className="p-6 flex-grow flex flex-col space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentPlant.commonName}</h2>
              <p className="text-emerald-600 italic font-medium">{currentPlant.scientificName}</p>
            </div>

            {showDetails ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2">
                   <span className="font-semibold text-gray-700">Luminosidade:</span>
                   <LightBadge type={currentPlant.light} />
                </div>
                <div>
                   <span className="font-semibold text-gray-700">Categoria:</span>
                   <span className="ml-2 text-gray-600">{currentPlant.category}</span>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <span className="font-semibold text-yellow-800 block mb-1">Curiosidade:</span>
                  <p className="text-yellow-900 text-sm leading-relaxed">{currentPlant.trivia}</p>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-400 italic">
                <p>Clique em "Mostrar Informações" para estudar</p>
              </div>
            )}
         </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 sticky bottom-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-center gap-2 bg-white border-2 border-emerald-600 text-emerald-600 py-3 rounded-xl font-bold hover:bg-emerald-50 active:scale-95 transition-transform"
        >
          {showDetails ? <><EyeOff size={20}/> Ocultar</> : <><Eye size={20}/> Mostrar</>}
        </button>
        
        {currentIndex < sessionPlants.length - 1 ? (
          <button 
            onClick={() => {
              setCurrentIndex(prev => prev + 1);
              setShowDetails(false);
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-transform"
          >
            Próxima <ChevronRight size={20} />
          </button>
        ) : (
          <button 
             onClick={handleFinish}
             className="flex items-center justify-center gap-2 bg-emerald-800 text-white py-3 rounded-xl font-bold hover:bg-emerald-900 active:scale-95 transition-transform"
          >
            Finalizar <CheckCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

const StudyPage = () => {
  const { plants, updatePlantImage, resetImage } = usePlantDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLight, setFilterLight] = useState<string>('all');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredPlants = useMemo(() => {
    return plants.filter(p => {
      const matchesSearch = p.commonName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.scientificName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLight = filterLight === 'all' || p.light === filterLight;
      return matchesSearch && matchesLight;
    });
  }, [searchTerm, filterLight, plants]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, plant: Plant) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const success = await updatePlantImage(plant.id, e.target.files[0]);
      if (success) {
        // Just clear the selection for a split second to refresh (in a real context app this would update auto)
        // Since we are using a hook in the parent, plants array updates, passing down.
        // We just need to ensure the selectedPlant state also reflects the new URL.
        const reader = new FileReader();
        reader.onload = (ev) => {
            setSelectedPlant(prev => prev ? { ...prev, imageUrl: ev.target?.result as string } : null);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
      setIsUploading(false);
    }
  };

  // Detail Modal
  if (selectedPlant) {
    const hasCustomImage = selectedPlant.imageUrl.startsWith('data:');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative flex flex-col">
          <button 
            onClick={() => setSelectedPlant(null)}
            className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-gray-100 z-10"
          >
            <X size={24} />
          </button>
          
          <div className="relative group">
            <img 
              src={selectedPlant.imageUrl} 
              alt={selectedPlant.commonName} 
              className="w-full h-72 object-cover"
            />
            {/* Upload Button Overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
               {hasCustomImage && (
                 <button 
                   onClick={() => {
                     resetImage(selectedPlant.id);
                     setSelectedPlant(prev => prev ? {...prev, imageUrl: PLANT_DATABASE.find(p => p.id === prev.id)?.imageUrl || ''} : null);
                   }}
                   className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-transform hover:scale-105"
                   title="Restaurar imagem original"
                 >
                   <RefreshCw size={20} />
                 </button>
               )}
               <label className="bg-emerald-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition-transform hover:scale-105 flex items-center justify-center">
                 {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Camera size={20} />}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="image/*"
                   onChange={(e) => handleFileUpload(e, selectedPlant)}
                 />
               </label>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{selectedPlant.commonName}</h2>
              <p className="text-lg text-emerald-600 italic font-medium">{selectedPlant.scientificName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
               <div className="bg-gray-50 p-3 rounded-lg">
                 <p className="text-gray-500 mb-1">Luminosidade</p>
                 <LightBadge type={selectedPlant.light} />
               </div>
               <div className="bg-gray-50 p-3 rounded-lg">
                 <p className="text-gray-500 mb-1">Categoria</p>
                 <span className="font-semibold text-gray-800">{selectedPlant.category}</span>
               </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
               <h4 className="font-bold text-amber-800 mb-2">Curiosidade</h4>
               <p className="text-amber-900">{selectedPlant.trivia}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-800">
              <Upload size={16} className="mt-1 flex-shrink-0" />
              <p>Dica: Clique no ícone de câmera na foto acima para enviar uma foto real desta planta da sua galeria ou câmera.</p>
            </div>

            <button 
              onClick={() => setSelectedPlant(null)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Fechar Ficha
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/" className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Plantas</h1>
      </div>

      <div className="space-y-3 sticky top-0 bg-green-50 z-10 py-2">
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', LightRequirement.FULL_SUN, LightRequirement.PARTIAL_SHADE, LightRequirement.SHADE].map((f) => (
             <button
               key={f}
               onClick={() => setFilterLight(f)}
               className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                 filterLight === f 
                 ? 'bg-emerald-600 text-white shadow-md' 
                 : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
               }`}
             >
               {f === 'all' ? 'Todas' : f}
             </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 pb-20">
        {filteredPlants.map((plant) => (
          <div 
            key={plant.id} 
            onClick={() => setSelectedPlant(plant)}
            className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="relative w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
               <img src={plant.imageUrl} alt={plant.commonName} className="w-full h-full object-cover" />
               {plant.imageUrl.startsWith('data:') && (
                 <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-tl-md">
                   <CheckCircle size={10} />
                 </div>
               )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 truncate">{plant.commonName}</h3>
              <p className="text-xs text-emerald-600 italic truncate">{plant.scientificName}</p>
              <div className="mt-1">
                 <LightBadge type={plant.light} />
              </div>
            </div>
          </div>
        ))}
        {filteredPlants.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Nenhuma planta encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

const QuizPage = () => {
  const { plants } = usePlantDatabase();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (plants.length > 0) {
        generateDailyQuiz();
    }
  }, [plants]);

  const generateDailyQuiz = () => {
    const q1Plant = getRandomPlantsFromList(plants, 4); // 1 correct, 3 wrong
    const q2Plant = getRandomPlantsFromList(plants, 1)[0];
    const q3Plant = getRandomPlantsFromList(plants, 4); // 1 correct, 3 wrong

    // Q1: Scientific -> Common
    const q1: QuizQuestion = {
      id: 1,
      type: 'SCIENTIFIC_TO_COMMON',
      questionText: `Qual o nome popular da planta "${q1Plant[0].scientificName}"?`,
      correctAnswer: q1Plant[0].commonName,
      options: q1Plant.map(p => p.commonName).sort(() => Math.random() - 0.5)
    };

    // Q2: Common -> Light
    const q2: QuizQuestion = {
      id: 2,
      type: 'COMMON_TO_LIGHT',
      questionText: `Qual a luminosidade ideal para a planta "${q2Plant.commonName}"?`,
      correctAnswer: q2Plant.light,
      options: [LightRequirement.FULL_SUN, LightRequirement.PARTIAL_SHADE, LightRequirement.SHADE].sort(() => Math.random() - 0.5)
    };

    // Q3: Photo -> Common
    const q3: QuizQuestion = {
      id: 3,
      type: 'PHOTO_TO_COMMON',
      questionText: "Qual o nome desta planta?",
      imageUrl: q3Plant[0].imageUrl, // Will use custom image if set
      correctAnswer: q3Plant[0].commonName,
      options: q3Plant.map(p => p.commonName).sort(() => Math.random() - 0.5)
    };

    setQuestions([q1, q2, q3]);
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === questions[currentQIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < 2) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const progress = getInitialProgress();
    const finalScore = score + (selectedOption === questions[currentQIndex].correctAnswer ? 1 : 0);
    
    // Fix: Ensure we don't double count if user clicks very fast, but here the state flow prevents it
    // Actually simpler: incrementing score inside handleAnswer means score state is only accurate for PREVIOUS questions.
    // The finish function runs on click "Ver Resultado".
    // If we rely on state `score`, it might be lagging by one question if not careful, 
    // BUT we update score in handleAnswer. By the time user clicks "Ver Resultado", re-render happened, score is up to date.
    
    saveProgress({
      ...progress,
      quizTotalQuestions: progress.quizTotalQuestions + 3,
      quizCorrectAnswers: progress.quizCorrectAnswers + score, // Score state is updated
      history: [...progress.history, { date: new Date().toISOString().split('T')[0], type: 'QUIZ', score: score }]
    });
  };

  if (questions.length === 0) return <div>Carregando Quiz...</div>;

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-fade-in h-full">
        <Trophy className={`w-24 h-24 ${score === 3 ? 'text-yellow-500' : 'text-gray-400'}`} />
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Resultado</h2>
          <p className="text-xl mt-2">Você acertou <span className="font-bold text-emerald-600">{score}</span> de 3!</p>
        </div>
        
        <Link to="/" className="w-full max-w-xs bg-emerald-600 text-white py-3 rounded-xl font-bold text-center hover:bg-emerald-700">
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
         <Link to="/" className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20} /></Link>
         <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((currentQIndex + 1) / 3) * 100}%` }}></div>
         </div>
         <span className="text-sm font-bold text-gray-500">{currentQIndex + 1}/3</span>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg flex-grow flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQ.questionText}</h2>
        
        {currentQ.imageUrl && (
          <img src={currentQ.imageUrl} alt="Quiz" className="w-full h-48 object-cover rounded-xl mb-6" />
        )}

        <div className="space-y-3 flex-grow">
          {currentQ.options.map((opt, idx) => {
             let btnClass = "w-full p-4 rounded-xl text-left border-2 transition-all font-medium ";
             if (isAnswered) {
               if (opt === currentQ.correctAnswer) btnClass += "bg-green-100 border-green-500 text-green-800";
               else if (opt === selectedOption) btnClass += "bg-red-100 border-red-500 text-red-800";
               else btnClass += "bg-gray-50 border-gray-100 text-gray-400";
             } else {
               btnClass += "bg-white border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700";
             }

             return (
               <button 
                 key={idx}
                 onClick={() => handleAnswer(opt)}
                 disabled={isAnswered}
                 className={btnClass}
               >
                 {opt}
               </button>
             );
          })}
        </div>

        {isAnswered && (
          <button 
            onClick={nextQuestion}
            className="mt-6 w-full py-4 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 animate-bounce-short"
          >
            {currentQIndex < 2 ? 'Próxima Pergunta' : 'Ver Resultado'}
          </button>
        )}
      </div>
    </div>
  );
};

const ProgressPage = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    setProgress(getInitialProgress());
  }, []);

  if (!progress) return <div>Carregando...</div>;

  const quizAccuracy = progress.quizTotalQuestions > 0 
    ? Math.round((progress.quizCorrectAnswers / progress.quizTotalQuestions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2 mb-2">
        <Link to="/" className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Meu Progresso</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center text-center">
           <div className="bg-emerald-100 p-3 rounded-full mb-3">
             <Leaf className="text-emerald-600" size={24} />
           </div>
           <span className="text-3xl font-bold text-gray-800">{progress.plantsStudiedCount}</span>
           <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Plantas Estudadas</span>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 flex flex-col items-center text-center">
           <div className="bg-orange-100 p-3 rounded-full mb-3">
             <Trophy className="text-orange-600" size={24} />
           </div>
           <span className="text-3xl font-bold text-gray-800">{progress.streakDays}</span>
           <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Dias Seguidos</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart size={20} className="text-blue-500"/> Desempenho no Quiz
          </h3>
          <span className="text-2xl font-bold text-blue-600">{quizAccuracy}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${quizAccuracy}%` }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-right">
          {progress.quizCorrectAnswers} acertos em {progress.quizTotalQuestions} perguntas
        </p>
      </div>

      {/* Mock Weekly Ranking */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Ranking Semanal (Oliveira Garden)</h3>
        <div className="space-y-3">
          {[
            { name: "Você", points: progress.plantsStudiedCount * 10 + progress.quizCorrectAnswers * 5, rank: 2 },
            { name: "Carlos M.", points: 450, rank: 1 },
            { name: "Ana P.", points: 210, rank: 3 },
            { name: "Roberto S.", points: 180, rank: 4 },
          ].sort((a,b) => b.points - a.points).map((user, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${user.name === 'Você' ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {idx + 1}
                </span>
                <span className="font-medium text-gray-800">{user.name}</span>
              </div>
              <span className="font-bold text-gray-600">{user.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cycle" element={<CyclePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}