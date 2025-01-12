import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import TextEditor from '../components/TextEditor';
import "../styles/EditCourseInfoPage.css";

type Params = {
    id: string;
}

export default function EditCourseInfoPage() {

    const { id } = useParams<Params>();
    const [course, setCourse] = useState<Course>();

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [image, setImage] = useState<File | null>(null);
    const [language, setLanguage] = useState<string>("en");
    const [duration, setDuration] = useState<number>(0);
    const [isPublic, setIsPublic] = useState<boolean>(false);
    const [priceCurrency, setPriceCurrency] = useState<string>("USD");
    const [price, setPrice] = useState<number>(0);
    const [promoPrice, setPromoPrice] = useState<number>(0);
    const [promoExpires, setPromoExpires] = useState<Date>(new Date());

    const [enablePromo, setEnablePromo] = useState<boolean>(false);

    const fetchCourse = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setCourse(data)
                setName(data.name);
                setDescription(data.description);
                setImage(data.image);
                setLanguage(data.language);
                setDuration(data.duration);
                setIsPublic(data.is_public);
                setPriceCurrency(data.price_currency);
                setPrice(data.price);
                setPromoPrice(data.promo_price);
                setPromoExpires(new Date(data.promo_expires));
                setEnablePromo(new Date(data.promo_expires) > new Date());
                console.log(data.promo_expires);
            });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
            let fr = new FileReader();
            fr.onload = function () {
                const imageElement = document.getElementById("course-image") as HTMLImageElement;
                if (imageElement) {
                    imageElement.src = fr.result as string;
                }
            }
            fr.readAsDataURL(e.target.files[0]);
        }
    }

    const handleEditCourse = async () => {
        console.log("asasda");
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        if (image)
            formData.append("image", image);
        formData.append("language", language.toLowerCase());
        formData.append("duration", duration.toString());
        formData.append("is_public", isPublic.toString());
        formData.append("price_currency", priceCurrency);
        formData.append("price", price.toString());
        formData.append("promo_price", promoPrice.toString());
        if (promoExpires) {
            if (!enablePromo)
                setPromoExpires(new Date());
            formData.append("promo_expires", formatDateToBackend(promoExpires));
        }

        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formData,
        })
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchCourse();
    }, []);

    if (!course) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="edit-course-info-main">
            <a href="/courses/my">
                <button className="edit-course-info-button">
                    Back to my courses
                </button>
            </a>
            <a href={`/course/${id}/view/info`}>
                <button className="edit-course-info-button">
                    View course as user
                </button>
            </a>
            <a href={`/course/${id}/edit`}>
                <button className="edit-course-info-button">
                    Edit course content
                </button>
            </a>
            <a href={`/course/${id}/edit/topics`}>
                <button className="edit-course-info-button">
                    Edit course topics
                </button>
            </a>
            <a href={`/course/${id}/edit/members`}>
                <button className="edit-course-info-button">
                    Edit gifted course members
                </button>
            </a>
            <div className="edit-course-info-header">Edit course information</div>
            <div className="edit-course-info-label-box">
                Name:&nbsp;<input className="edit-course-info-input-text" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="edit-course-info-label-box">
                Description:&nbsp;
            </div>
            <TextEditor value={description} onChange={(value) => setDescription(value)} /> <br />
            <div className="edit-course-info-label-box">
                Image:&nbsp;
            </div>
            <img className="edit-course-info-image" src={MEDIA_URL + course.image} id="course-image" /> <br />
            <div className="edit-course-info-label-box">
                Upload new image:&nbsp;<input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="edit-course-info-label-box">
                Language:&nbsp;
                <select className="edit-course-info-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map(([code, name, flag]) => (
                        <option key={code} value={code}>
                            {flag}&nbsp;{name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="edit-course-info-label-box">
                Duration:&nbsp;<input className="edit-course-info-input-number" min={1} type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} /> h
            </div>
            <div className="edit-course-info-label-box">
                Course visibility:&nbsp;
                <select className="edit-course-info-select" value={isPublic.toString()} onChange={(e) => setIsPublic(e.target.value === "true")}>
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                </select>
            </div>
            <div className="edit-course-info-label-box">
                Price currency:&nbsp;
                <select className="edit-course-info-select" value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)}>
                    {CURRENCIES.map(([code, flag]) => (
                        <option key={code} value={code}>
                            {flag}&nbsp;{code}
                        </option>
                    ))}
                </select>
            </div>
            <div className="edit-course-info-label-box">
                Regular price:&nbsp;<input className="edit-course-info-input-number" type="text" value={intToPrice(price)} onChange={(e) => setPrice(priceToInt(e.target.value))} />
            </div>
            <div className="edit-course-info-label-box">
                Enable promo:&nbsp;
                <select className="edit-course-info-select" value={enablePromo.toString()} onChange={(e) => setEnablePromo(e.target.value === "true")}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            {enablePromo ?
                <>
                    <div className="edit-course-info-label-box">
                        Promo price:&nbsp;<input className="edit-course-info-input-number" type="text" value={intToPrice(promoPrice)} onChange={(e) => setPromoPrice(priceToInt(e.target.value))} />
                    </div>
                    <div className="edit-course-info-label-box">
                        Promo expires:&nbsp;<input type="datetime-local" value={formatDateTimeLocal(new Date(promoExpires))} onChange={(e) => setPromoExpires(new Date(e.target.value))} />
                    </div>
                </>
                : ""}
            <br />
            <button className="edit-course-info-button" type="button" onClick={handleEditCourse}>Save changes</button>
            <br /><br /><br /><br />

        </div>
    )
};