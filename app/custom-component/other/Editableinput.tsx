import React from "react";

type EditableInputProps = React.ComponentProps<"input"> & {
    containerClassName?: string;
};

export default function EditableInput({
    containerClassName = "border-r px-1",
    className = "",
    ...props
}: EditableInputProps) {
    return (
        <div className={containerClassName}>
            <input
                {...props}
                className={`w-full h-7 px-1 bg-transparent outline-none focus:bg-gray-50 ${className}`}
            />
        </div>
    );
}
