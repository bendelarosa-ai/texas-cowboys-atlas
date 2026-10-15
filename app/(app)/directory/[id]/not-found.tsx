import Link from "next/link";

export default function MemberNotFound() {
  return (
    <div className="container-app py-20 text-center">
      <p className="font-serif text-3xl font-semibold text-stone-900">We couldn&rsquo;t find that member</p>
      <p className="mt-2 text-stone-600">The link may be out of date, or the record may have been merged.</p>
      <Link href="/directory" className="btn-primary mt-6">Back to the directory</Link>
    </div>
  );
}
