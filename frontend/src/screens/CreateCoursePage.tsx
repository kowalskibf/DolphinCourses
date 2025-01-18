import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { LANGUAGES, CURRENCIES } from '../constants';
import { formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn } from '../functions';
import "../styles/CreateCoursePage.css";
import TextEditor from '../components/TextEditor';

export default function CreateCoursePage() {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [image, setImage] = useState<File | null>(null);
    const [language, setLanguage] = useState<string>("en");
    const [duration, setDuration] = useState<number>(1);
    const [isPublic, setIsPublic] = useState<string>("False");
    const [priceCurrency, setPriceCurrency] = useState<string>("USD");
    const [price, setPrice] = useState<number>(0);
    const [promoPrice, setPromoPrice] = useState<number>(0);
    const [promoExpires, setPromoExpires] = useState<Date>(new Date());
    const [errorName, setErrorName] = useState<string | null>(null);
    const [errorDescription, setErrorDescription] = useState<string | null>(null);
    const [errorDuration, setErrorDuration] = useState<string | null>(null);
    const [errorPrice, setErrorPrice] = useState<string | null>(null);
    const [errorPromoPrice, setErrorPromoPrice] = useState<string | null>(null);
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

    const [newCourseId, setNewCourseId] = useState<number | null>(null);

    const [step, setStep] = useState<number>(1);
    const MAX_STEPS = 5;

    const [enablePromo, setEnablePromo] = useState<boolean>(false);

    const resetErrors = async () => {
        setErrorName(null);
        setErrorDescription(null);
        setErrorDuration(null);
        setErrorPrice(null);
        setErrorPromoPrice(null);
        setErrorGlobal(null);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
            let fr = new FileReader();
            fr.onload = function () {
                const imageElement = document.getElementById("uploaded-image") as HTMLImageElement;
                if (imageElement) {
                    imageElement.src = fr.result as string;
                }
            }
            fr.readAsDataURL(e.target.files[0]);
        }
    }

    const handleCreateCourse = async () => {
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
        if (promoExpires)
            formData.append("promo_expires", formatDateToBackend(promoExpires));
        const response = await fetch("http://127.0.0.1:8000/api/course", {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formData,
        });
        if (response.ok) {
            const r = await response.json();
            setNewCourseId(r.newCourseId);
            setStep(step + 1);
        } else {
            setErrorGlobal("Something went wrong.");
        }
        // .then((response) => {
        //     if (response.ok) {
        //         setStep(step + 1);
        //         const r = response.json();
        //         setNewCourseId(r.newCourseId);
        //     } else {
        //         setErrorGlobal("Something went wrong.");
        //     }
        // })
    }

    const handlePrev = async () => {
        resetErrors();
        if (step > 1)
            setStep(step - 1);
        else
            window.location.replace("/courses/my");
    }

    const handleNext = async () => {
        resetErrors();
        switch (step) {
            case 1:
                if (true) { // warunki czy dobre name i desc
                    setStep(step + 1);
                } else {
                    console.log();
                }
                break;
            case 2:
                if (true) { // warunki czy dobre zdjecie
                    setStep(step + 1);
                } else {
                    console.log();
                }
                break;
            case 3:
                if (true) { // warunki czy dobry jezyk i dlugosc
                    setStep(step + 1);
                } else {
                    console.log();
                }
                break;
            case 4:
                if (true) { // warunki
                    setStep(step + 1);
                } else {
                    console.log();
                }
                break;
        }
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
    }, [])

    return (
        <div id="create-course-main">
            <div className="text-align-center">
                <h1>Step {step} of {MAX_STEPS}</h1>

                {step == 1 ?
                    <>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="create-course-label-box">
                                Course name
                            </div>
                            <input className="create-course-input-text" placeholder="Course name" type="text" value={name} onChange={(e) => setName(e.target.value)} /> <br />
                            {errorName ? errorName : ""} <br />
                            <div className="create-course-label-box">
                                Course description
                            </div>
                            <TextEditor value={description} onChange={(value) => setDescription(value)} /> <br />
                            {errorDescription ? errorDescription : ""} <br />
                            <button className="create-course-step-button" type="button" onClick={handlePrev}>Back to my courses</button>
                            <button className="create-course-step-button" type="button" onClick={handleNext}>Next step</button>
                        </form>
                    </>
                    : ""}

                {step == 2 ?
                    <>
                        <div className="course-uploaded-image-container">
                            <img className="course-uploaded-image" id="uploaded-image" />
                        </div>
                        <div className="create-course-label-box">
                            Upload image&nbsp;
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <button className="create-course-step-button" type="button" onClick={handlePrev}>Prev step</button>
                        <button className="create-course-step-button" type="button" onClick={handleNext}>Next step</button>
                    </>
                    : ""}

                {step == 3 ?
                    <>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="create-course-label-box">Language:&nbsp;
                                <select className="create-course-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    {LANGUAGES.map(([code, name, flag]) => (
                                        <option key={code} value={code}>
                                            {flag}&nbsp;{name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="create-course-label-box">
                                Duration:&nbsp;
                                <input
                                    className="create-course-input-number"
                                    type="number"
                                    min={1}
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                />
                                h
                            </div>
                            <button className="create-course-step-button" type="button" onClick={handlePrev}>Prev step</button>
                            <button className="create-course-step-button" type="button" onClick={handleNext}>Next step</button>
                        </form>
                    </>
                    : ""}

                {step == 4 ?
                    <>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="create-course-label-box">
                                Course visibility:&nbsp;
                                <select className="create-course-select" value={isPublic.toString()} onChange={(e) => setIsPublic(e.target.value)}>
                                    <option value="False">Private</option>
                                    <option value="True">Public</option>
                                </select>
                            </div>
                            <div className="create-course-label-box">
                                Price currency:&nbsp;
                                <select className="create-course-select" value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)}>
                                    {CURRENCIES.map(([code, flag]) => (
                                        <option key={code} value={code}>
                                            {flag}&nbsp;{code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="create-course-label-box">
                                Regular price:&nbsp;<input className="create-course-input-number" type="text" value={intToPrice(price)} onChange={(e) => setPrice(priceToInt(e.target.value))} />
                            </div>
                            <div className="create-course-label-box">
                                Enable promo:&nbsp;
                                <select className="create-course-select" value={enablePromo.toString()} onChange={(e) => setEnablePromo(e.target.value === 'true')}>
                                    <option value="false">No</option>
                                    <option value="true">Yes</option>
                                </select>
                            </div>
                            {enablePromo ?
                                <>
                                    <div className="create-course-label-box">
                                        Promo price: <input className="create-course-input-number" type="text" value={intToPrice(promoPrice)} onChange={(e) => setPromoPrice(priceToInt(e.target.value))} />
                                    </div>
                                    <div className="create-course-label-box">
                                        Promo expires: <input className="reate-course-input-datetime-local" type="datetime-local" value={formatDateTimeLocal(promoExpires)} onChange={(e) => setPromoExpires(new Date(e.target.value))} />
                                    </div>
                                </>
                                : ""}
                            <button className="create-course-step-button" type="button" onClick={handlePrev}>Prev step</button>
                            <button className="create-course-step-button" type="button" onClick={handleCreateCourse}>Create course</button>
                        </form>
                    </>
                    : ""}

                {step == 5 ?
                    <>
                        {newCourseId ? (
                            <>
                                <div className="create-course-label-box">Your course has been created!</div>
                                <a href={`/course/${newCourseId}/edit/info`}>
                                    <button type="button" className="create-course-step-button">View my new course</button>
                                </a>
                            </>
                        ) : (
                            "..."
                        )}



                    </>
                    : ""}
            </div>

        </div>
    )


}