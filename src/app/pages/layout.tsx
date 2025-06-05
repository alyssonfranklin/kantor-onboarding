import NavBar from "@/components/client/NavBar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-auto bg-white border border-green-500">
        <div>
          <NavBar />
        </div>
        <div className="w-full border border-yellow-500">
            {children}
        </div>
    </div>
  );
}
