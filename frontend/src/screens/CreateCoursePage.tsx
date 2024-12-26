import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { LANGUAGES, CURRENCIES } from '../constants';
import { formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt } from '../functions';

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
        })
            .then((response) => {
                if (response.ok) {
                    setStep(step + 1);
                } else {
                    setErrorGlobal("Something went wrong.");
                }
            })
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

    return (
        <>
            <h1>Step {step} of {MAX_STEPS}</h1>
            {step == 1 ?
                <>
                    <form onSubmit={(e) => e.preventDefault()}>
                        name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} /> <br />
                        {errorName ? errorName : ""} <br />
                        description: <textarea value={description} onChange={(e) => setDescription(e.target.value)} /> <br />
                        {errorDescription ? errorDescription : ""} <br />
                        <button type="button" onClick={handlePrev}>Back to my courses</button>
                        <button type="button" onClick={handleNext}>Next step</button>
                    </form>
                </>
                : ""}

            {step == 2 ?
                <>
                    <img id="uploaded-image"></img>
                    Upload image
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    <button type="button" onClick={handlePrev}>Back</button>
                    <button type="button" onClick={handleNext}>Next step</button>
                </>
                : ""}

            {step == 3 ?
                <>
                    <form onSubmit={(e) => e.preventDefault()}>
                        language:
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            {LANGUAGES.map(([code, name, flag]) => (
                                <option key={code} value={code}>
                                    {flag}&nbsp;{name}
                                </option>
                            ))}
                        </select>
                        <br />
                        duration: <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
                        <button type="button" onClick={handlePrev}>Back</button>
                        <button type="button" onClick={handleNext}>Next step</button>
                    </form>
                </>
                : ""}

            {step == 4 ?
                <>
                    <form onSubmit={(e) => e.preventDefault()}>
                        public/private:
                        <select value={isPublic.toString()} onChange={(e) => setIsPublic(e.target.value)}>
                            <option value="False">Private</option>
                            <option value="True">Public</option>
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
                        <select value={enablePromo.toString()} onChange={(e) => setEnablePromo(e.target.value === 'true')}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                        <br />
                        {enablePromo ?
                            <>
                                promo price: <input type="text" value={intToPrice(promoPrice)} onChange={(e) => setPromoPrice(priceToInt(e.target.value))} />
                                <br />
                                promo expires: <input type="datetime-local" value={formatDateTimeLocal(promoExpires)} onChange={(e) => setPromoExpires(new Date(e.target.value))} />
                                <br />
                            </>
                            : ""}
                        <button type="button" onClick={handlePrev}>Back</button>
                        <button type="button" onClick={handleCreateCourse}>Create course</button>
                    </form>
                </>
                : ""}

            {step == 5 ?
                <>
                    Your course has been created!

                </>
                : ""}


        </>
    )


}