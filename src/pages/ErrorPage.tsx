import React from "react";
import { Text } from "@nextui-org/react"
import useTranslation from "../hooks/TranslationHook";

interface ErrorProps {
	type: string,
	cause?: string
}

const ErrorPage = ({type, cause}: ErrorProps) => {
	return <>
		<Text h1>{useTranslation(`error.${type}`)}</Text>
		<Text h3>{useTranslation(`error.${type}.${cause ?? "message"}`)}</Text>
	</>
}

export default ErrorPage;