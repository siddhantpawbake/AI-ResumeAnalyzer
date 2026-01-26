import { prepareInstructions } from 'constants/index';
import {useState, type FormEvent} from 'react'
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

// Function to check if Puter.js account credits are exhausted
const checkAccountCredits = async (): Promise<{hasCredits: boolean; credits: number; error: string | null}> => {
    try {
        if (!window.puter || !window.puter.auth) {
            return {
                hasCredits: false,
                credits: 0,
                error: 'Puter.js is not available'
            };
        }

        const user = await window.puter.auth.getUser();
        
        // Check if user object has credits property
        if (!user || typeof user !== 'object') {
            return {
                hasCredits: false,
                credits: 0,
                error: 'Unable to retrieve user information'
            };
        }

        const credits = (user as any)?.credits || 0;
        
        // If credits are 0 or less, they are exhausted
        if (credits <= 0) {
            return {
                hasCredits: false,
                credits: 0,
                error: 'Account credits exhausted. Please purchase credits to continue.'
            };
        }

        return {
            hasCredits: true,
            credits: credits,
            error: null
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check account credits';
        return {
            hasCredits: false,
            credits: 0,
            error: errorMessage
        };
    }
};

const Upload = () => {

    const {auth,isLoading,fs,ai,kv}=usePuterStore();
    const[isProcessing,setIsProcessing]=useState(false);
    const[statusText,setStatusText]=useState('');
    const[file,setFile]=useState<File|null> (null);
    const[creditError,setCreditError]=useState<string|null>(null);
    const navigate=useNavigate();

    const handleAnalyze=async({companyName,jobTitle,jobDescription,file}:{companyName:string,jobTitle:string,jobDescription:string,file:File})=>{
        setIsProcessing(true);
        setStatusText('Checking account credits...');
        setCreditError(null);
        
        // Check if user has sufficient credits
        const creditCheck = await checkAccountCredits();
        if (!creditCheck.hasCredits) {
            setIsProcessing(false);
            setCreditError(creditCheck.error || 'Unable to verify credits');
            setStatusText('');
            return;
        }

        setStatusText('Uploading...');
        const uploadedFile=await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Failed to upload file');
        setStatusText('converting to image');
        const imageFile=await convertPdfToImage(file);
        if(!imageFile.file)return setStatusText('Failed to convert pdf to image');
        setStatusText('Uploading the image');
        const uploadedImage=await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Failed to upload image');
        setStatusText('Preparing data...');
        const uuid=generateUUID();
        const data={
            id:uuid,
            resumePath:uploadedFile.path,
            imagePath:uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback:'',
        }
        await kv.set(`resume:${uuid}`,JSON.stringify(data));
        setStatusText('Analyzing');
        const feedback=await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle,jobDescription})
        )
         if(!feedback) return setStatusText('Failed to analyze resume');
         const feedbackText=typeof feedback.message.content==='string' ? feedback.message.content
         : feedback.message.content[0].text;
         data.feedback=JSON.parse(feedbackText);
         await kv.set(`resume:${uuid}`, JSON.stringify(data));
         setStatusText('Analysis complete,redirecting...');
         console.log(data);
         navigate(`/resume/${uuid}`);
    }

    const handleSubmit=(e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        const form=e.currentTarget.closest('form');
        if(!form) return;
        const formData=new FormData(form);

        const companyName=formData.get('company-name') as string;
        const jobTitle=formData.get('job-title') as string;
        const jobDescription=formData.get('job-description') as string;

        if(!file) return;
        handleAnalyze({companyName,jobTitle,jobDescription,file});
    }
    
    const handleFileSelect=(file:File|null)=>{
        setFile(file)
    } 
    return (
     <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      
      <section className="main-section">
        <div className="page-heading">
            <h1>Smart feedback for your dream job</h1>
            {creditError && (
                <div className="error-message" style={{
                    backgroundColor: '#fee',
                    borderLeft: '4px solid #f44',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    borderRadius: '4px',
                    color: '#c00',
                    fontWeight: '500'
                }}>
                    ⚠️ {creditError}
                </div>
            )}
            {isProcessing ? (
            <>
            <h2>
                {statusText}
            </h2>
            <img src="/images/resume-scan.gif" className="w-full" />
            </>
        ):(
                <h2>Drop your resume for ATS Score and improvement</h2>
            )}
        {!isProcessing&&(
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-div">
                    <label htmlFor="company-name">Company Name</label>
                    <input type="text" name="company-name" placeholder='Company Name' id='companyname'/>
                </div>
                 <div className="form-div">
                    <label htmlFor="job-title">Job Title</label>
                    <input type="text" name="job-title" placeholder='Job-title' id='jobtitle'/>
                </div>
                 <div className="form-div">
                    <label htmlFor="job-description">Job Description</label>
                    <textarea rows={5} name="job-description" placeholder='Job Description' id='companyname'/>
                </div>
                <div className="form-div">
                    <label htmlFor="job-uploader">Upload Resume</label>
                    <FileUploader onFileSelect={handleFileSelect}>
                    </FileUploader>
                </div>
                <button className='primary-button' type="submit">Analyze Resume</button>
            </form> 
        )}
        </div>
        </section>
    </main>
  )
}

export default Upload