# DolphinCourses

DolphinCourses (Dynamic Online Learning Platform for Holistic Insights and Navigation - Courses) - An application for designing and organizing educational courses with progress tracking functionality.

A web application that allows users to create courses with a complex, tree-like structure, enabling resource reusability and monitoring user progress within a given course.

This application was developed as part of an engineering thesis in the field of Automation and Robotics at the Faculty of Electronics and Information Technology at the Warsaw University of Technology.

## Purpose

The goal of the application is to create an educational platform of the "marketplace" type, enabling course creators to easily design, organize, and share complex courses without the need for knowledge of technical aspects. The application supports resource reusability and monitors user progress during the learning process, providing feedback on their skill levels in specific areas.

## Intended Audience

The application is intended for individuals and organizations that want to create, sell, and manage online courses. With the intuitive platform, users can create courses with different structures, as well as browse other users' courses and track their progress. It is ideal for anyone wanting to share their educational materials with a broad audience.

## Requirements

- **Python**: 3.9
- **pip**

### Installation

#### 1. Clone the repository:
  ```
  git clone https://github.com/kowalskibf/DolphinCourses.git
  ```

#### 2. Install required packaged for the back-end:
  ```
  cd DolphinCourses
  pip install -r requirements.txt
  ```

#### 3. Install front-end dependencies:
  ```
  npm install -g npm
  npm install react-quill
  npm install react-katex
  ```

#### 4. Database migration:
  ```
  cd backend
  python manage.py makemigrations
  python manage.py migrate
  ```

### Running the Application

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
