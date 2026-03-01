// script.js

const app = {
    data: [],
    currentCategory: null,
    currentMode: null, // 'study' or 'exam'
    currentQuestions: [],
    currentIndex: 0,
    score: 0,
    timer: null,
    mistakes: [],
    currentLanguage: 'fr',

    translations: {
        fr: {
            reset: "Réinitialiser",
            dashTitle: "Prêt pour l'examen ?",
            dashSubtitle: "Choisissez un thème pour commencer vos révisions.",
            mastered: "Maîtrisé",
            back: "← Retour",
            theme: "Thème",
            modeSubtitle: "Choisissez votre mode d'apprentissage",
            studyTitle: "Mode Étude 📖",
            studyDesc: "Flashcards, astuces mémoire, pas de stress.",
            examTitle: "Mode Examen ⏱️",
            examDesc: "30s par question, score final, conditions réelles.",
            question: "Question",
            tipLabel: "💡 Astuce Mémoire",
            next: "Question Suivante",
            correct: "Bravo !",
            wrong: "Oups...",
            correctAnswer: "La bonne réponse est :",
            finished: "Terminé !",
            resSubtitle: "Voici votre résultat pour cette session.",
            corrects: "correctes",
            perfect: "Un sans faute ! Félicitations ! 🌟",
            retry: "Réessayer",
            menu: "Menu Principal",
            confirmReset: "Voulez-vous vraiment effacer toute votre progression ?",
            answerLabel: "Réponse :",
            review: "Réviser",
            backToResults: "Retour aux résultats"
        },
        en: {
            reset: "Reset",
            dashTitle: "Ready for the Exam?",
            dashSubtitle: "Choose a topic to start your revision.",
            mastered: "Mastered",
            back: "← Back",
            theme: "Topic",
            modeSubtitle: "Choose your learning mode",
            studyTitle: "Study Mode 📖",
            studyDesc: "Flashcards, memory tips, no stress.",
            examTitle: "Exam Mode ⏱️",
            examDesc: "30s per question, final score, real conditions.",
            question: "Question",
            tipLabel: "💡 Memory Tip",
            next: "Next Question",
            correct: "Well done!",
            wrong: "Oops...",
            correctAnswer: "The correct answer is:",
            finished: "Finished!",
            resSubtitle: "Here is your result for this session.",
            corrects: "correct",
            perfect: "Perfect score! Congratulations! 🌟",
            retry: "Retry",
            menu: "Main Menu",
            confirmReset: "Do you really want to clear all your progress?",
            answerLabel: "Answer:",
            review: "Review",
            backToResults: "Back to Results"
        }
    },

    init: function() {
        // Load data from the global variable defined in data.json
        if (typeof QUIZ_DATA !== 'undefined') {
            this.data = QUIZ_DATA;
        } else {
            console.error("Erreur: data.js non chargé.");
            return;
        }

        // Load language preference
        const savedLang = localStorage.getItem('france_prepa_lang');
        if (savedLang) {
            this.currentLanguage = savedLang;
        }

        this.updateUI();
        this.renderDashboard();
        this.loadProgress();
    },

    // --- Language Logic ---

    toggleLanguage: function() {
        this.currentLanguage = this.currentLanguage === 'fr' ? 'en' : 'fr';
        localStorage.setItem('france_prepa_lang', this.currentLanguage);
        this.updateUI();
        
        // Re-render current view if necessary
        if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
            this.renderDashboard();
        } else if (!document.getElementById('quiz-view').classList.contains('hidden')) {
            this.loadQuestion(); // Reload current question to update text
        } else if (!document.getElementById('results-view').classList.contains('hidden')) {
            this.showResults();
        } else if (!document.getElementById('mode-view').classList.contains('hidden')) {
             // Update category title
             const cat = this.currentCategory;
             const catObj = this.data.find(c => c.category === cat);
             if(catObj) {
                 const catName = this.currentLanguage === 'fr' ? catObj.category : (catObj.category_en || catObj.category);
                 document.getElementById('selected-category-title').innerText = catName;
             }
        }
    },

    updateUI: function() {
        const t = this.translations[this.currentLanguage];
        document.getElementById('lang-display').innerText = this.currentLanguage.toUpperCase();
        
        document.getElementById('btn-reset').innerText = t.reset;
        document.getElementById('dash-title').innerText = t.dashTitle;
        document.getElementById('dash-subtitle').innerText = t.dashSubtitle;
        
        document.getElementById('btn-back').innerText = t.back;
        document.getElementById('mode-subtitle').innerText = t.modeSubtitle;
        document.getElementById('mode-study-title').innerText = t.studyTitle;
        document.getElementById('mode-study-desc').innerText = t.studyDesc;
        document.getElementById('mode-exam-title').innerText = t.examTitle;
        document.getElementById('mode-exam-desc').innerText = t.examDesc;
        
        document.getElementById('tip-label-text').innerText = t.tipLabel.replace('💡 ', '');
        document.getElementById('btn-next').innerText = t.next;
        
        document.getElementById('res-title').innerText = t.finished;
        document.getElementById('res-subtitle').innerText = t.resSubtitle;
        document.getElementById('res-correct-label').innerText = t.corrects;
        document.getElementById('btn-retry').innerText = t.retry;
        document.getElementById('btn-menu').innerText = t.menu;
    },

    // --- Navigation & Views ---

    showDashboard: function() {
        this.stopTimer();
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('mode-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.add('hidden');
        document.getElementById('results-view').classList.add('hidden');
        this.renderDashboard(); // Re-render to update progress bars
    },

    showModeSelection: function(category) {
        this.currentCategory = category;
        const item = this.data.find(q => q.category === category);
        const displayCat = this.currentLanguage === 'fr' ? category : (item.category_en || category);
        
        document.getElementById('selected-category-title').innerText = displayCat;
        
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('mode-view').classList.remove('hidden');
    },

    // --- Dashboard Logic ---

    renderDashboard: function() {
        const grid = document.getElementById('categories-grid');
        grid.innerHTML = '';

        // Get unique categories (using French as key)
        const categories = [...new Set(this.data.map(item => item.category))];

        categories.forEach(cat => {
            // Find first item to get English name
            const item = this.data.find(q => q.category === cat);
            const displayCat = this.currentLanguage === 'fr' ? cat : (item.category_en || cat);

            // Calculate progress from LocalStorage
            const progress = this.getCategoryProgress(cat);
            const t = this.translations[this.currentLanguage];
            
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer';
            card.onclick = () => this.showModeSelection(cat);
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-lg text-slate-800">${displayCat}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                        ${this.data.filter(q => q.category === cat).length} Q
                    </span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                    <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                </div>
                <p class="text-xs text-slate-400 text-right">${progress}% ${t.mastered}</p>
            `;
            grid.appendChild(card);
        });
    },

    // --- Quiz Logic ---

    startQuiz: function(mode) {
        if (!this.currentCategory) {
            this.showDashboard();
            return;
        }
        this.currentMode = mode;
        this.score = 0;
        this.currentIndex = 0;
        this.mistakes = [];
        
        // Filter questions by category and shuffle
        this.currentQuestions = this.data
            .filter(q => q.category === this.currentCategory)
            .sort(() => 0.5 - Math.random());

        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('mode-view').classList.add('hidden');
        document.getElementById('results-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');

        // Setup UI based on mode
        const timerBadge = document.getElementById('timer-badge');
        if (mode === 'exam') {
            timerBadge.classList.remove('hidden');
        } else {
            timerBadge.classList.add('hidden');
        }

        this.loadQuestion();
    },

    loadQuestion: function() {
        const q = this.currentQuestions[this.currentIndex];
        const total = this.currentQuestions.length;
        const t = this.translations[this.currentLanguage];
        
        const displayCat = this.currentLanguage === 'fr' ? q.category : (q.category_en || q.category);
        const questionText = this.currentLanguage === 'fr' ? q.question : (q.question_en || q.question);
        const options = this.currentLanguage === 'fr' ? q.options : (q.options_en || q.options);

        // Reset UI
        document.getElementById('flashcard-inner').classList.remove('rotate-y-180');
        document.getElementById('quiz-progress').innerText = `${t.question} ${this.currentIndex + 1}/${total}`;
        document.getElementById('question-category-tag').innerText = displayCat;
        document.getElementById('question-text').innerText = questionText;
        
        // Render Options
        const optsContainer = document.getElementById('options-container');
        optsContainer.innerHTML = '';
        
        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-4 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium text-slate-700';
            btn.innerText = opt;
            btn.onclick = () => this.handleAnswer(index);
            optsContainer.appendChild(btn);
        });

        // Start Timer if Exam Mode
        if (this.currentMode === 'exam') {
            this.startTimer();
        }
    },

    handleAnswer: function(selectedIndex) {
        const q = this.currentQuestions[this.currentIndex];
        const isCorrect = selectedIndex === q.correct;
        const btns = document.getElementById('options-container').querySelectorAll('button');

        if (this.currentMode === 'study') {
            // STUDY MODE: Show feedback immediately (Flip Card)
            this.stopTimer(); // Just in case
            this.populateBackCard(isCorrect, q);
            document.getElementById('flashcard-inner').classList.add('rotate-y-180');
            
            if (!this.isReviewing) {
                if (isCorrect) this.score++;
                else this.mistakes.push(q);
            }

        } else {
            // EXAM MODE: Highlight selected answer before moving next
            this.stopTimer();

            if (selectedIndex !== -1) {
                const selectedBtn = btns[selectedIndex];
                selectedBtn.classList.remove('hover:bg-blue-50', 'hover:border-blue-300', 'border-slate-200');
                if (isCorrect) {
                    selectedBtn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-700', 'ring-2', 'ring-emerald-200');
                } else {
                    selectedBtn.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-700', 'ring-2', 'ring-rose-200');
                    // Also briefly show the correct one
                    const correctBtn = btns[q.correct];
                    correctBtn.classList.remove('border-slate-200');
                    correctBtn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-700');
                }
            } else {
                // Timeout case: just show correct answer
                const correctBtn = btns[q.correct];
                correctBtn.classList.remove('border-slate-200');
                correctBtn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-700');
            }

            // Disable all buttons to prevent multiple clicks
            btns.forEach(btn => btn.disabled = true);

            if (isCorrect) this.score++;
            else this.mistakes.push(q);
            
            // Small delay before next question to register the feedback
            setTimeout(() => this.nextQuestion(), 800);
        }
    },

    populateBackCard: function(isCorrect, question) {
        const title = document.getElementById('feedback-title');
        const icon = document.getElementById('feedback-icon');
        const answerText = document.getElementById('feedback-correct-answer');
        const tipText = document.getElementById('feedback-tip');
        const answerContainer = document.getElementById('feedback-answer-container');
        const t = this.translations[this.currentLanguage];

        if (isCorrect) {
            title.innerText = t.correct;
            title.className = "text-2xl font-bold mb-4 text-emerald-600";
            icon.innerText = "🎉";
            answerContainer.className = "p-4 rounded-2xl bg-emerald-50 border border-emerald-100";
            answerText.className = "text-lg font-bold text-emerald-900";
        } else {
            title.innerText = t.wrong;
            title.className = "text-2xl font-bold mb-4 text-rose-600";
            icon.innerText = "❌";
            answerContainer.className = "p-4 rounded-2xl bg-rose-50 border border-rose-100";
            answerText.className = "text-lg font-bold text-rose-900";
        }

        const correctOpt = this.currentLanguage === 'fr' ? question.options[question.correct] : (question.options_en[question.correct] || question.options[question.correct]);
        const tip = this.currentLanguage === 'fr' ? question.tip : (question.tip_en || question.tip);

        document.getElementById('feedback-correct-label').innerText = t.correctAnswer;
        answerText.innerText = correctOpt;
        tipText.innerText = tip;
        document.getElementById('tip-label-text').innerText = t.tipLabel.replace('💡 ', '');
    },

    nextQuestion: function() {
        if (this.isReviewing) {
            this.showResults();
            return;
        }
        this.currentIndex++;
        if (this.currentIndex < this.currentQuestions.length) {
            this.loadQuestion();
        } else {
            this.showResults();
        }
    },

    // --- Timer Logic (Exam Mode) ---

    startTimer: function() {
        this.stopTimer();
        let timeLeft = 30;
        const display = document.getElementById('timer-display');
        display.innerText = `${timeLeft}s`;
        display.parentElement.classList.remove('bg-red-100', 'text-red-600');

        this.timer = setInterval(() => {
            timeLeft--;
            display.innerText = `${timeLeft}s`;

            if (timeLeft <= 5) {
                display.parentElement.classList.add('bg-red-100', 'text-red-600');
            }

            if (timeLeft <= 0) {
                this.stopTimer();
                this.handleAnswer(-1); // Time out = wrong answer
            }
        }, 1000);
    },

    stopTimer: function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    // --- Results & Persistence ---

    showResults: function() {
        this.isReviewing = false;
        document.getElementById('quiz-view').classList.add('hidden');
        document.getElementById('results-view').classList.remove('hidden');

        const total = this.currentQuestions.length;
        const percentage = Math.round((this.score / total) * 100);
        
        document.getElementById('score-display').innerText = `${this.score}/${total}`;
        
        // Save Progress
        this.saveCategoryProgress(this.currentCategory, percentage);

        // Show Mistakes
        const list = document.getElementById('results-feedback-list');
        list.innerHTML = '';
        const t = this.translations[this.currentLanguage];
        
        if (this.mistakes.length === 0) {
            list.innerHTML = `<p class="text-center text-green-600 font-bold">${t.perfect}</p>`;
        } else {
            this.mistakes.forEach((q, idx) => {
                const qText = this.currentLanguage === 'fr' ? q.question : (q.question_en || q.question);
                const ansText = this.currentLanguage === 'fr' ? q.options[q.correct] : (q.options_en[q.correct] || q.options[q.correct]);
                const tipText = this.currentLanguage === 'fr' ? q.tip : (q.tip_en || q.tip);

                const item = document.createElement('div');
                item.className = 'bg-red-50 p-4 rounded-lg border border-red-100 text-sm flex flex-col gap-2';
                item.innerHTML = `
                    <div class="flex justify-between items-start gap-2">
                        <p class="font-bold text-red-900 mb-1 flex-grow">${qText}</p>
                        <button onclick="app.reviewSingle(${idx})" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold hover:bg-red-200 transition-colors uppercase tracking-wider whitespace-nowrap">
                            ${t.review}
                        </button>
                    </div>
                    <p class="text-red-700">${t.answerLabel} ${ansText}</p>
                    <p class="text-slate-500 text-xs mt-1 italic">💡 ${tipText}</p>
                `;
                list.appendChild(item);
            });
        }
    },

    reviewSingle: function(mistakeIdx) {
        this.isReviewing = true;
        const question = this.mistakes[mistakeIdx];
        
        // Setup quiz view for single question review
        this.currentQuestions = [question];
        this.currentIndex = 0;
        this.currentMode = 'study'; // Force study mode to show tip

        document.getElementById('results-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');
        document.getElementById('timer-badge').classList.add('hidden');

        this.loadQuestion();
        
        // Automatically flip to show answer
        setTimeout(() => {
            this.handleAnswer(-1); // -1 triggers "wrong" style but shows correct answer
            // Update button text
            const t = this.translations[this.currentLanguage];
            document.getElementById('btn-next').innerText = t.backToResults;
        }, 100);
    },

    // --- LocalStorage Helpers ---

    getCategoryProgress: function(category) {
        const saved = localStorage.getItem('france_prepa_progress');
        if (!saved) return 0;
        const progress = JSON.parse(saved);
        return progress[category] || 0;
    },

    saveCategoryProgress: function(category, newScore) {
        let saved = localStorage.getItem('france_prepa_progress');
        let progress = saved ? JSON.parse(saved) : {};
        
        // Only overwrite if new score is better
        if (!progress[category] || newScore > progress[category]) {
            progress[category] = newScore;
            localStorage.setItem('france_prepa_progress', JSON.stringify(progress));
        }
    },

    loadProgress: function() {
        // Just ensures storage is initialized if needed
        if (!localStorage.getItem('france_prepa_progress')) {
            localStorage.setItem('france_prepa_progress', JSON.stringify({}));
        }
    },

    resetApp: function() {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser votre progression ? Cela supprimera toutes vos données.")) {
            // Clear local storage to reset saved progress
            localStorage.clear();
            // Reload the page to reset the state
            location.reload();
        }
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
