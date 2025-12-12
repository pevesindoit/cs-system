interface h1Type {
    children: string
}

export default function H1({ children }: h1Type) {
    return (
        <h1 className="scroll-m-20 pb-2 text font-semibold tracking-tight first:mt-0">
            {children}
        </h1>
    )
}