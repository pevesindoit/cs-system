interface h1Type {
    children: string
}

export default function H1({ children }: h1Type) {
    return (
        <h2 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
            {children}
        </h2>
    )
}