type User = {
    id: number;
    username: string;
    email: string;
    date_joined: Date;
    first_name: string;
    last_name: string;
}

type AccountSocials = {
    id: number;
    facebook: string;
    instagram: string;
    tiktok: string;
    linkedin: string;
}

type Account = {
    id: number;
    user: User;
    avatar: string;
    is_admin: boolean;
    bio: string;
    socials: AccountSocials;
    is_banned: boolean;
}

type Course = {
    id: number;
    author: Account;
    name: string;
    description: string;
    image: string;
    language: string;
    duration: string;
    last_updated: Date;
    is_public: boolean;
    price_currency: string;
    price: number;
    promo_price: number;
    promo_expires: number;
}

type Review = {
    id: number;
    author: Account;
    course: Course;
    rating: number;
    comment: string;
    date: Date;
}

interface CourseElement {
    id: number;
    name: string;
    author: Account;
    type: 'text' | 'image' | 'video' | 'example' | 'assignment' | 'exam' | 'module';
}

interface ModuleElement extends CourseElement {
    type: 'module';
    title: string;
    description: string;
    image?: string;
}

interface TextElement extends CourseElement {
    type: 'text';
    content: string;
}

interface ImageElement extends CourseElement {
    type: 'image';
    image: string;
    description: string;
}

interface VideoElement extends CourseElement {
    type: 'video';
    video: string;
    description: string;
}

interface ExampleElement extends CourseElement {
    type: 'example';
    question: string;
    explanation: string;
    image?: string;
}

interface AssignmentElement extends CourseElement {
    type: 'assignment';
    question: string;
    answers: string[];
    correct_number_indices: number[];
    is_multiple_choice: boolean;
    explanation: string;
    image?: string;
}

interface ExamElement extends CourseElement {
    type: 'exam';
    description: string;
    duration: number;
    total_marks: number;
}

type ExamQuestion = {
    id: number;
    exam: ExamElement;
    question: AssignmentElement;
    order: number;
}

type CourseModule = {
    id: number;
    course: Course;
    module: ModuleElement;
    order: number;
}

type ModuleToElement = {
    id: number;
    module: ModuleElement;
    element: CourseElement;
    order: number;
}

type CourseAccess = {
    id: number;
    account: Account;
    course: Course;
    expires: Date;
}