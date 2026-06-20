import Image from "next/image";

export default function Banner() {
  return (
    <div className="w-full bg-white border-b border-stone-200 py-4 flex justify-center">
      <Image
        src="/Texas Cowboys Est 1922 Logo_secondary.jpeg"
        alt="Texas Cowboys Est. 1922"
        width={320}
        height={80}
        className="h-16 w-auto object-contain"
      />
    </div>
  );
}
