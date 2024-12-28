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

interface BaseCourseElement {
    id: number;
    name: string;
    author: Account;
}

interface TextElement extends BaseCourseElement {
    type: 'text';
    data: {
        content: string;
    };
}

interface ImageElement extends BaseCourseElement {
    type: 'image';
    data: {
        image: string;
        description: string;
    };
}

interface VideoElement extends BaseCourseElement {
    type: 'video';
    data: {
        video: string;
        description: string;
    };
}

interface ExampleElement extends BaseCourseElement {
    type: 'example';
    data: {
        question: string;
        image?: string;
        explanation: string;
        explanation_image?: string;
    };
}

interface AssignmentElement extends BaseCourseElement {
    type: 'assignment';
    data: {
        question: string;
        image?: string;
        answers: string[];
        correct_answer_indices: number[];
        is_multiple_choice: boolean;
        hide_answers: boolean;
        explanation: string;
        explanation_image?: string;
    };
}

interface ExamElement extends BaseCourseElement {
    type: 'exam';
    data: {
        description: string;
        duration: number;
        total_marks: number;
    };
}

interface ModuleElement extends BaseCourseElement {
    type: 'module';
    data: {
        title: string;
        description: string;
        image?: string;
    };
}

type CourseElement =
    | TextElement
    | ImageElement
    | VideoElement
    | ExampleElement
    | AssignmentElement
    | ExamElement
    | ModuleElement;

type ExamQuestion = {
    id: number;
    exam: ExamElement;
    question: AssignmentElement;
    marks: number;
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
    course: Course;
    order: number;
}

type CourseAccess = {
    id: number;
    account: Account;
    course: Course;
    expires: Date;
    is_active: boolean;
    obtaining_type: string;
}

type CourseTopic = {
    id: number;
    course: Course;
    topic: string;
}

type AssignmentWeight = {
    id: number;
    assignment: AssignmentElement;
    topic: CourseTopic;
    weight: number;
}

type AccountTopic = {
    id: number;
    account: Account;
    course_topic: CourseTopic;
    value: number;
}

// CourseStructure

type CourseTopicStructure = {
    id: number;
    topic: string;
};

type AssignmentWeightStructure = {
    id: number;
    topic: CourseTopicStructure;
    weight: number;
};

type TextElementStructure = {
    id: number;
    content: string;
}

type ImageElementStructure = {
    id: number;
    image: string;
    description: string;
}

type VideoElementStructure = {
    id: number;
    video: string;
    description: string;
}

type ExampleElementStructure = {
    id: number;
    question: string;
    image: string;
    explanation: string;
    explanation_image: string;
}

type AssignmentElementStructure = {
    id: number;
    question: string;
    image?: string;
    answers: string[];
    correct_answer_indices: number[];
    is_multiple_choice: boolean;
    hide_answers: boolean;
    explanation: string;
    explanation_image?: string;
    weights: AssignmentWeightStructure[];
};

type ExamQuestionStructure = {
    id: number;
    question: AssignmentElementStructure;
    marks: number;
    order: number;
};

type ExamElementStructure = {
    id: number;
    description: string;
    duration: number;
    total_marks: number;
    questions: ExamQuestionStructure[];
};

type ModuleWeightStructure = {
    id: number;
    topic: CourseTopicStructure;
    weight: number;
};

type BaseElementDataStructure = {
    id: number;
    name: string;
    type: 'module' | 'text' | 'image' | 'video' | 'example' | 'assignment' | 'exam';
}

type ElementDataStructure =
    | {
        type: 'module';
        data: ModuleElementStructure;
    }
    | {
        type: 'text';
        data: TextElementStructure //TextElement;
    }
    | {
        type: 'image';
        data: ImageElementStructure //ImageElement;
    }
    | {
        type: 'video';
        data: VideoElementStructure //VideoElement;
    }
    | {
        type: 'example';
        data: ExampleElementStructure //ExampleElement;
    }
    | {
        type: 'assignment';
        data: AssignmentElementStructure;
    }
    | {
        type: 'exam';
        data: ExamElementStructure;
    };

type ElementStructure = BaseElementDataStructure & ElementDataStructure;

type ElementToModuleStructure = {
    id: number;
    order: number;
    element_data: ElementStructure //ElementDataStructure;
    uses: number; //
};

type ModuleElementStructure = {
    id: number;
    title: string;
    description: string;
    image?: string;
    elements: ElementToModuleStructure[];
    weights: ModuleWeightStructure[];
};

type ModuleToCourseStructure = {
    id: number;
    order: number;
    module: ElementStructure //ElementDataStructure //ModuleElementStructure;
    uses: number; //
};

type CourseStructure = {
    id: number;
    author: Account;
    name: string;
    description: string;
    image: string;
    language: string;
    duration: string;
    last_updated: string;
    is_public: boolean;
    price_currency: string;
    price: number;
    promo_price: number;
    promo_expires: number;
    modules: ModuleToCourseStructure[];
};
