# DolphinCourses

DolphinCourses (ang. Dynamic Online Learning Platform for Holistic Insights and Navigation - Courses) - Aplikacja do projektowania i organizacji kursów edukacyjnych z funkcją analizy postępów.

Aplikacja webowa pozwalająca tworrzyć kursy o złożonej, drzewiastej strukturze, pozwalająca na reużywalność zasobów dydaktycznych oraz monitorująca progresję użytkownika w danym kursie.

Aplikacja powstała jako część pracy inżynierskiej na kierunku Automatyka i Robotyka na Wydziale Elektroniki i Technik Informacyjnych Politechniki Warszawskiej.

## Cel

Celem aplikacji jest stworzenie platformy edukacyjnej typu "marketplace", umożliwiającej twórcom kursów łatwe projektowanie, organizowanie i udostępnianie szkoleń o złożonej strukturze, bez konieczności znajomości technicznych aspektów. Aplikacja wspiera reużywalność zasobów dydaktycznych, a także monitoruje postępy użytkowników w trakcie nauki, dostarczając im informacji zwrotnych na temat poziomu ich umiejętności w danych dziedzinach.

## Przeznaczenie

Aplikacja jest przeznaczona dla osób i organizacji, które chcą tworzyć, sprzedawać i zarządzać kursami online. Dzięki intuicyjnej platformie, użytkownicy mogą tworzyć kursy o różnej strukturze, a także przeglądać kursy innych użytkowników i śledzić swoje postępy. Idealna dla każdej osoby chcącej udostępnić swoje materiały edukacyjne szerokiemu gronu odbiorców.

## Wymagania

- **Python**: 3.9
- **pip**

### Instalacja

#### 1. Pobranie repozytorium:
  ```
  git clone https://github.com/kowalskibf/DolphinCourses.git
  ```

#### 2. Instalacja wymaganych paczek do back-endu:
  ```
  cd DolphinCourses
  pip install -r requirements.txt
  ```

#### 3. Instalacja wymagań od front-endu:
  ```
  npm install -g npm
  npm install react-quill
  npm install react-katex
  ```

#### 4. Migracja bazy danych:
  ```
  cd backend
  python manage.py makemigrations
  python manage.py migrate
  ```

### Uruchomienie

#### Back-end:
  ```
  cd backend
  python manage.py runserver
  ```

#### Front-end:
  ```
  cd frontend
  npm run dev
  ```
