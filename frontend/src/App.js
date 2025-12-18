import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './App.css';

const API_BASE_URL = 'http://localhost:8080/api';

function App() {
  const [file, setFile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ total: 0, known: 0 });

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      loadQuestions(selectedTopic.value);
    }
  }, [selectedTopic]);

  useEffect(() => {
    updateStats();
  }, [questions]);

  const loadTopics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/topics`);
      const topicOptions = response.data.map(topic => ({
        value: topic,
        label: topic
      }));
      setTopics(topicOptions);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadQuestions = async (topic) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/topic/${topic}`);
      setQuestions(response.data);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/questions/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Файл успешно загружен!');
      loadTopics();
      setFile(null);
    } catch (error) {
      alert('Ошибка при загрузке файла');
      console.error(error);
    }
  };

  const handleMarkAsKnown = async () => {
    const currentQuestion = questions[currentIndex];
    try {
      await axios.put(`${API_BASE_URL}/questions/${currentQuestion.id}/mark-known`);
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex].known = true;
      setQuestions(updatedQuestions);
      nextQuestion();
    } catch (error) {
      console.error('Error marking as known:', error);
    }
  };

  const handleShowAnswer = async () => {
    const currentQuestion = questions[currentIndex];
    try {
      await axios.put(`${API_BASE_URL}/questions/${currentQuestion.id}/increment-view`);
      setShowAnswer(true);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const nextQuestion = () => {
    setCurrentIndex((prevIndex) =>
        prevIndex < questions.length - 1 ? prevIndex + 1 : 0
    );
    setShowAnswer(false);
  };

  const prevQuestion = () => {
    setCurrentIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : questions.length - 1
    );
    setShowAnswer(false);
  };

  const updateStats = () => {
    const total = questions.length;
    const known = questions.filter(q => q.known).length;
    setStats({ total, known });
  };

  const clearAllData = async () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные?')) {
      try {
        await axios.delete(`${API_BASE_URL}/questions/clear-all`);
        setTopics([]);
        setQuestions([]);
        setSelectedTopic(null);
        alert('Все данные удалены');
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
      <div className="App">
        <header className="App-header">
          <h1>📚 Система изучения вопросов</h1>
        </header>

        <main className="App-main">
          <div className="upload-section">
            <h2>📤 Загрузить таблицу с вопросами</h2>
            <p>Формат Excel: Тема | Вопрос | Ответ</p>
            <form onSubmit={handleFileUpload}>
              <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
              />
              <button type="submit" disabled={!file}>
                Загрузить
              </button>
            </form>
          </div>

          <div className="topic-section">
            <h2>📝 Выбор темы</h2>
            <Select
                options={topics}
                value={selectedTopic}
                onChange={setSelectedTopic}
                placeholder="Выберите тему..."
                isSearchable
            />
          </div>

          {currentQuestion && (
              <div className="question-section">
                <div className="stats">
                  <span>Всего вопросов: {stats.total}</span>
                  <span>Выучено: {stats.known}</span>
                  <span>Прогресс: {stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0}%</span>
                  <span>Просмотрено раз: {currentQuestion.viewCount}</span>
                </div>

                <div className="navigation">
                  <button onClick={prevQuestion} disabled={questions.length <= 1}>
                    ← Назад
                  </button>
                  <span>
                Вопрос {currentIndex + 1} из {questions.length}
              </span>
                  <button onClick={nextQuestion} disabled={questions.length <= 1}>
                    Далее →
                  </button>
                </div>

                <div className="question-card">
                  <div className="topic-badge">
                    Тема: {currentQuestion.topic}
                  </div>

                  <h3 className="question-text">
                    ❓ {currentQuestion.question}
                  </h3>

                  {showAnswer ? (
                      <div className="answer-section">
                        <h4>Ответ:</h4>
                        <p className="answer-text">✅ {currentQuestion.answer}</p>
                      </div>
                  ) : (
                      <button
                          className="show-answer-btn"
                          onClick={handleShowAnswer}
                      >
                        👀 Посмотреть ответ
                      </button>
                  )}

                  <div className="actions">
                    <button
                        className="know-btn"
                        onClick={handleMarkAsKnown}
                        disabled={currentQuestion.known}
                    >
                      {currentQuestion.known ? '✓ Выучено' : '✅ Знаю'}
                    </button>

                    {!showAnswer && (
                        <button
                            className="skip-btn"
                            onClick={nextQuestion}
                        >
                          ⏭️ Пропустить
                        </button>
                    )}
                  </div>
                </div>
              </div>
          )}

          <div className="controls">
            <button
                className="clear-btn"
                onClick={clearAllData}
            >
              🗑️ Очистить все данные
            </button>
          </div>
        </main>
      </div>
  );
}

export default App;