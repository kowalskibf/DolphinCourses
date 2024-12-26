import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';

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
        fetchCourse();
    }, []);

    if (!course) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href="/courses/my">Back to my courses</a>
            <br />
            <a href={`/course/${id}/view`}>View course as user</a>
            <br />
            <a href={`/course/${id}/edit`}>Edit course content</a>
            <br />
            <a href={`/course/${id}/edit/topics`}>Edit course topics</a>
            <br />
            <a href={`/course/${id}/edit/members`}>Edit gifted course members</a>
            <br />
            <h1>Edit course information</h1>
            Name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} /> <br />
            Description: <textarea value={description} onChange={(e) => setDescription(e.target.value)} /> <br />
            Image: <img src={MEDIA_URL + course.image} id="course-image" /> <br />
            Upload new image:
            <input type="file" accept="image/*" onChange={handleFileChange} /> <br />
            Language:
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map(([code, name, flag]) => (
                    <option key={code} value={code}>
                        {flag}&nbsp;{name}
                    </option>
                ))}
            </select> <br />
            Duration: <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            <br />
            public/private:
            <select value={isPublic.toString()} onChange={(e) => setIsPublic(e.target.value === "true")}>
                <option value="false">Private</option>
                <option value="true">Public</option>
            </select>
            <br />
            currency:
            <select value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)}>
                {CURRENCIES.map(([code, flag]) => (
                    <option key={code} value={code}>
                        {flag}&nbsp;{code}
                    </option>
                ))}
            </select>
            <br />
            regular price: <input type="text" value={intToPrice(price)} onChange={(e) => setPrice(priceToInt(e.target.value))} />
            <br />
            enable promo?
            <select value={enablePromo.toString()} onChange={(e) => setEnablePromo(e.target.value === "true")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
            </select>
            <br />
            {enablePromo ?
                <>
                    promo price: <input type="text" value={intToPrice(promoPrice)} onChange={(e) => setPromoPrice(priceToInt(e.target.value))} />
                    <br />
                    promo expires: <input type="datetime-local" value={formatDateTimeLocal(new Date(promoExpires))} onChange={(e) => setPromoExpires(new Date(e.target.value))} />
                    <br />
                </>
                : ""}
            <br />
            <button type="button" onClick={handleEditCourse}>Save changes</button>
            <br /><br /><br /><br />

        </>
    )
};