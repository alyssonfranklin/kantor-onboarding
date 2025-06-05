import NavBar from "@/components/client/NavBar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-auto bg-white">
        <div>
          <NavBar />
        </div>
        <div className="w-full">
            {children}
        </div>
    </div>
  );
}
