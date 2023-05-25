import { Combobox } from "@/components/combobox";
import Detail from "@/components/task/detail";
import Files from "@/components/task/files";
import Matches from "@/components/task/matches";
import Preview from "@/components/task/preview";
import Sidebar from "@/components/task/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRepos } from "@/filesystem/queries";
import { useQuery } from "@tanstack/react-query";
import { Folder } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

export function Task() {
  const match = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();

  const repos = useRepos();

  const [fileTaskPatch, setFileTaskPatch] = useState<
    Record<
      string,
      Record<
        string,
        {
          disable?: boolean;
        }
      >
    >
  >({});

  const repoItems = useMemo(() => {
    const Demo = {
      label: (
        <>
          <Folder className="mr-2 h-4 w-4" /> Demo
        </>
      ),
      value: "demo",
    };

    return [
      Demo,
      ...(repos.data?.map((repo) => ({
        label: (
          <>
            <Folder className="mr-2 h-4 w-4" /> {repo.name}
          </>
        ),
        value: repo.name,
      })) || []),
    ];
  }, [repos.data]);

  return (
    <div className="flex-grow flex flex-row">
      <div className="basis-60 border-r flex-shrink-0">
        <div className="sticky top-14 p-4 flex flex-col gap-2">
          <Combobox
            value={match.repo || null}
            onChange={(repo) => {
              if (repo !== match.repo) {
                navigate(`/repo/${repo}`);
              }
            }}
            data={repoItems}
          />
          <Sidebar
            value={match.tab || "detail"}
            onSelect={(tab) => {
              navigate(`/repo/${match.repo}/${tab}`);
            }}
          />
        </div>
      </div>
      <div
        className="container flex flex-row items-start py-4"
        style={{
          width: "calc(100vw - 300px)",
        }}
      >
        {(!match.tab || match.tab === "detail") && (
          <Detail repo={match.repo as string} />
        )}
        {match.tab === "files" && (
          <Files
            repo={match.repo as string}
            onFileClick={(file) => {
              navigate("/repo/" + match.repo + "/preview?file=" + file);
            }}
          />
        )}
        {match.tab === "matches" && (
          <Matches
            repo={match.repo as string}
            onFileClick={(file, start) => {
              navigate(
                "/repo/" +
                  match.repo +
                  "/preview?file=" +
                  file +
                  "&start=" +
                  start
              );
            }}
          />
        )}
        {match.tab === "preview" && (
          <Preview
            repo={match.repo as string}
            file={search.get("file")}
            defaultStart={search.get("start")}
            fileTaskPatch={fileTaskPatch}
            onFileTaskPatchChange={(file, id, patch) => {
              setFileTaskPatch((prev) => {
                const newPatch = {
                  ...prev,
                  [file]: {
                    ...prev[file],
                    [id]: {
                      ...prev[file]?.[id],
                      ...patch,
                    },
                  },
                };
                return newPatch;
              });
            }}
            onFileChange={(file) => {
              setSearch({ file });
            }}
          />
        )}
      </div>
    </div>
  );
}

export function RedirectTask() {
  const repos = useRepos({
    suspense: true,
  });

  return <Navigate to={"/repo/" + repos.data?.[0].name || "demo"} />;
}
