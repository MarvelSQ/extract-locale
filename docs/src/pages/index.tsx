import { Button } from "@/components/ui/button";
import { useRepos } from "@/filesystem/queries";
import { Link } from "react-router-dom";

export function Home() {
  const repos = useRepos();

  return (
    <section className="flex-grow self-center flex flex-col justify-center">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Extract Locale
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6 mb-6">
        replace all your{" "}
        <span className="font-bold text-black dark:text-white ">word/文本</span>{" "}
        to <span className="">formatMessage</span>
      </p>
      <Button asChild>
        <Link to={`/repo/${repos.data?.length ? repos.data[0].name : "demo"}`}>
          Get Start
        </Link>
      </Button>
    </section>
  );
}
