import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResuMind" },
    { name: "description", content: "AI feedback for your dream Job!" },
  ];
}

export default function Home() {
  const {auth,kv}=usePuterStore();
  const navigate=useNavigate();
  const[resumeUrl,setResumeUrl]=useState(''); 
  const[resumes,setResumes]=useState<Resume[]>([]);
  const[loadingResumes,setLoadingResumes]=useState(false);

  useEffect(()=>{
    const loadResume=async()=>{
      setLoadingResumes(true);
      const resumes=(await kv.list('resume*',true))as KVItem[];
      const parsedResumes=resumes?.map((resume)=>(
        JSON.parse(resume.value) as Resume
      ))
      console.log("parserResume->",parsedResumes)
      setResumes(parsedResumes || []);
      setLoadingResumes(false); 
    }
    loadResume()
  },[])
  useEffect(()=>{
        if(!auth.isAuthenticated) navigate('auth?next=/');
    },[auth.isAuthenticated])
     

    return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      
      <section className="main-section">
        <div className="page-heading py-12">
          <h1>Track your Applications & Resume score</h1>
          {!loadingResumes && resumes?.length===0?(
          <h2>No resumes found. Upload your first resumes</h2>
          ):(
            <h2>
              Review your submissions and check feedback
            </h2>
          )}
        </div>
        {loadingResumes &&(
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]"></img>
          </div>
        )}
      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )} 
      {!loadingResumes&&resumes?.length===0 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <Link to="/upload" className="primary-button w-fit text-xl font-semibold">Upload Resume</Link>
        </div>
      )}
      </section>
    </main>
  );
}
