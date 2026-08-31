import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';
import './dashboard.css';

const DEPARTMENT_ROLES = {
    'MCC': [
        'Commissioner',
        'Executive Engineer (EE)',
        'Assistant Executive Engineer (AEE)',
        'Assistant Engineer (AE) / Junior Engineer (JE)',
        'MCC Contractor'
    ],
    'Water Supply & Sewage Board': [
        'Executive Engineer (EE)',
        'Assistant Executive Engineer (AEE — Water Supply)',
        'Assistant Engineer (AE) / Junior Engineer (JE)',
        'Water Board Contractor'
    ],
    'MESCOM': [
        'Executive Engineer (EE) / Assistant Executive Engineer (AEE)',
        'Section Officer (SO) / Assistant Engineer (AE)',
        'Lineman / Junior Lineman (JLM)',
        'MESCOM Contractor'
    ],
    'Stray / Animal Welfare & Health Dept': [
        'Health Officer / Chief Veterinary Officer',
        'Senior Health Inspector (SHI) / Junior Health Inspector (JHI)',
        'Animal Catching Squad / Field Handler',
        'Health Dept Contractor'
    ],
    'City Council (Ward Corporators)': [
        'Corporator'
    ]
};
const MANGALORE_60_WARDS_LIST = [
    "Ward 1 - Surathkal West", "Ward 2 - Surathkal East", "Ward 3 - Katipalla East", "Ward 4 - Katipalla Krishnapura", "Ward 5 - Katipalla North",
    "Ward 6 - Idya East", "Ward 7 - Idya West", "Ward 8 - Hosabettu", "Ward 9 - Kulai", "Ward 10 - Baikampady",
    "Ward 11 - Panambur Bengre", "Ward 12 - Panjimogaru", "Ward 13 - Kunjathbail North", "Ward 14 - Marakada", "Ward 15 - Kunjathbail South",
    "Ward 16 - Bengre Kulur", "Ward 17 - Derebail North", "Ward 18 - Kavoor", "Ward 19 - Pacchanady", "Ward 20 - Tiruvail",
    "Ward 21 - Padavu West", "Ward 22 - Kadri Padav", "Ward 23 - Derebail East", "Ward 24 - Derebail South", "Ward 25 - Derebail West",
    "Ward 26 - Derebail Central", "Ward 27 - Boloor", "Ward 28 - Mannagudda", "Ward 29 - Kambla", "Ward 30 - Kodialbail",
    "Ward 31 - Bejai", "Ward 32 - Kadri North", "Ward 33 - Kadri South", "Ward 34 - Shivbagh", "Ward 35 - Padavu Central",
    "Ward 36 - Padav East", "Ward 37 - Maroli", "Ward 38 - Bendoor", "Ward 39 - Falnir", "Ward 40 - Court",
    "Ward 41 - Central Market", "Ward 42 - Donkarakery", "Ward 43 - Kudroli", "Ward 44 - Bunder", "Ward 45 - Port",
    "Ward 46 - Cantonment", "Ward 47 - Milagres", "Ward 48 - Kankanady Valencia", "Ward 49 - Kankanady", "Ward 50 - Alape South",
    "Ward 51 - Alape North", "Ward 52 - Kannur", "Ward 53 - Bajal", "Ward 54 - Jeppinamogaru", "Ward 55 - Attavara",
    "Ward 56 - Mangaladevi", "Ward 57 - Hoigebazar", "Ward 58 - Bolara", "Ward 59 - Jeppu", "Ward 60 - Bengre"
];

const MANGALORE_WARD_ALIASES = {
    1: ['surathkal', 'nitk', 'surathkal west', 'beach', 'tadambail', 'idya'],
    2: ['surathkal', 'surathkal east', 'janatha colony', 'kana'],
    3: ['katipalla', 'katipalla east', 'kaikamba', 'ganeshpura'],
    4: ['katipalla', 'krishnapura', 'katipalla krishnapura'],
    5: ['katipalla', 'katipalla north', 'mrpl', 'kuthethoor'],
    6: ['idya', 'idya east', 'surathkal', 'hosabettu'],
    7: ['idya', 'idya west', 'surathkal'],
    8: ['hosabettu', 'kulai'],
    9: ['kulai', 'honnakatte'],
    10: ['baikampady', 'apmc', 'meenakaliya', 'industrial area'],
    11: ['panambur', 'bengre', 'nmpt', 'port', 'panambur bengre'],
    12: ['panjimogaru', 'kulur', 'vidyanagar'],
    13: ['kunjathbail', 'kunjathbail north', 'maravoor', 'airport road'],
    14: ['marakada', 'bondel', 'kavoor', 'airport road'],
    15: ['kunjathbail', 'kunjathbail south', 'bondel', 'surathkal'],
    16: ['bengre kulur', 'kulur', 'bengre'],
    17: ['derebail', 'derebail north', 'konchady'],
    18: ['kavoor', 'bondel', 'pacchanady', 'airport road'],
    19: ['pacchanady', 'vamanjoor', 'kudupu'],
    20: ['tiruvail', 'vamanjoor', 'st joseph'],
    21: ['padavu', 'padavu west', 'shakthinagar'],
    22: ['kadri', 'kadri padav', 'shakthinagar', 'padav'],
    23: ['derebail', 'derebail east', 'kuntikan', 'aj hospital'],
    24: ['derebail', 'derebail south', 'bejai', 'kapikad'],
    25: ['derebail', 'derebail west', 'kottara', 'kottara chowki'],
    26: ['derebail', 'derebail central', 'landlinks', 'urwa stores'],
    27: ['boloor', 'sultan battery', 'ladyhill'],
    28: ['mannagudda', 'urwa', 'canara high school'],
    29: ['kambla', 'alake', 'kudroli'],
    30: ['kodialbail', 'mg road', 'pvs', 'empire mall', 'sharada'],
    31: ['bejai', 'ksrtc', 'city centre', 'circuit house', 'museum'],
    32: ['kadri', 'kadri north', 'mallikatte', 'temple'],
    33: ['kadri', 'kadri south', 'shivbagh', 'nanthoor'],
    34: ['shivbagh', 'kadri', 'bikarnakatte'],
    35: ['padavu', 'padavu central', 'bikarnakatte', 'kulshekar'],
    36: ['padav', 'padav east', 'kulshekar', 'cordel'],
    37: ['maroli', 'kulashekara', 'nanthoor'],
    38: ['bendoor', 'bendoorwell', 'st agnes'],
    39: ['falnir', 'kmc', 'highland', 'avery'],
    40: ['court', 'hampankatta', 'ks rao road', 'light house hill'],
    41: ['central market', 'market', 'town hall', 'railway station'],
    42: ['donkarakery', 'dongerkery', 'car street', 'venkataramana'],
    43: ['kudroli', 'gokarnanatheshwara', 'alake'],
    44: ['bunder', 'old port', 'central market'],
    45: ['port', 'bunder', 'fisheries'],
    46: ['cantonment', 'clock tower', 'nehru maidan'],
    47: ['milagres', 'hampankatta', 'resaldar'],
    48: ['valencia', 'kankanady', 'kankanady valencia', 'father muller'],
    49: ['kankanady', 'pumpwell', 'mahaveer circle'],
    50: ['alape', 'alape south', 'padil'],
    51: ['alape', 'alape north', 'padil', 'shakthinagar'],
    52: ['kannur', 'adyar', 'bc road'],
    53: ['bajal', 'faisal nagar'],
    54: ['jeppinamogaru', 'pumpwell', 'netravathi bridge'],
    55: ['attavara', 'attavar', 'kmc hospital', 'chakrapani'],
    56: ['mangaladevi', 'bolar', 'temple'],
    57: ['hoigebazar', 'hoige bazaar', 'bolar', 'fisheries college'],
    58: ['bolara', 'bolar', 'tile factory'],
    59: ['jeppu', 'morgans gate', 'cascia'],
    60: ['bengre', 'kasba bengre', 'alive bagilu']
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('view');

    const [userProfile, setUserProfile] = useState({ name: 'Citizen', email: '', role: 'citizen', department: null });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [deviceCoords, setDeviceCoords] = useState(null);
    const [coordsStatus, setCoordsStatus] = useState('');

    const categoryToDepartmentMap = {
        "Potholes and Road Damage": "MCC",
        "Footpath and Pedestrian Hazards": "MCC",
        "Open Drains and Stormwater Overflows": "MCC",
        "Public Parks and Playgrounds": "MCC",
        "Water Main Leaks / Pipe Bursts": "Water Supply & Sewage Board",
        "Contaminated Water Supply": "Water Supply & Sewage Board",
        "Overflowing or Blocked Manholes": "Water Supply & Sewage Board",
        "Missing Manhole Covers": "Water Supply & Sewage Board",
        "Sparking Transformers / Substation Faults": "MESCOM",
        "Fallen or Low-Hanging Power Lines": "MESCOM",
        "Frequent or Unannounced Power Outages": "MESCOM",
        "Damaged Utility Poles": "MESCOM",
        "Stray Animal Menace": "Stray / Animal Welfare & Health Dept",
        "Injured or Abandoned Cattle": "Stray / Animal Welfare & Health Dept",
        "Illegal Garbage Dumping": "Stray / Animal Welfare & Health Dept",
        "Pest / Vector-Borne Outbreaks": "Stray / Animal Welfare & Health Dept"
    };

    const [selectedCategory, setSelectedCategory] = useState('');
    const [mappedDepartment, setMappedDepartment] = useState('');

    const acquireLocation = () => {
        setCoordsStatus('Acquiring location telemetry...');
        if (!navigator.geolocation) {
            setCoordsStatus('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setDeviceCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setCoordsStatus(`Location acquired: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            (error) => {
                console.error(error);
                setCoordsStatus(`Location access denied: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };
    const [submitSuccess, setSubmitSuccess] = useState({ show: false, complaintId: null });
    const [formErrors, setFormErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myGrievances, setMyGrievances] = useState([]);
    const [loadingTrack, setLoadingTrack] = useState(false);
    const [allGrievances, setAllGrievances] = useState([]);
    const [loadingView, setLoadingView] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [backedTicketIds, setBackedTicketIds] = useState([]);
    const [ticketComments, setTicketComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [whitelistedContractors, setWhitelistedContractors] = useState([]);
    const [duplicateCandidates, setDuplicateCandidates] = useState([]);
    const [stagedFormData, setStagedFormData] = useState(null);
    const [stagedFormElement, setStagedFormElement] = useState(null);
    const [selectedParentNo, setSelectedParentNo] = useState('');
    const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
    const [aiSummaryStatus, setAiSummaryStatus] = useState(null); // 'accepted' | 'rejected' | null
    const [customDescriptionText, setCustomDescriptionText] = useState('');
    const [rejectionFeedbackText, setRejectionFeedbackText] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [summaryGenerationCount, setSummaryGenerationCount] = useState(1);

    const runAIImageAnalysis = async (fileObject, feedback = '', prevSummary = '') => {
        if (!fileObject || !fileObject.type.startsWith('image/')) return;
        setAiAnalysisLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', fileObject);
            formData.append('description', customDescriptionText);
            if (feedback) formData.append('user_feedback', feedback);
            if (prevSummary) formData.append('previous_summary', prevSummary);

            const res = await fetch(`${API_BASE_URL}/api/grievances/analyze-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success && data.aiResult) {
                setAiAnalysisResult(data.aiResult);
                setSummaryGenerationCount(prev => prev + 1);
                setShowRejectionInput(false);
                setRejectionFeedbackText('');
                setAiSummaryStatus(null);
            } else {
                console.warn('AI preview analysis failed:', data.error);
            }
        } catch (err) {
            console.error('Network error during AI image analysis:', err);
        } finally {
            setAiAnalysisLoading(false);
        }
    };

    const handleBackDuplicate = async (candidateNo) => {
        await handleGrievanceUpvote(null, candidateNo);
        setBackedTicketIds(prev => [...prev, candidateNo]);
        if (stagedFormElement) {
            stagedFormElement.reset();
        }
        setSelectedFiles([]);
        setDeviceCoords(null);
        setCoordsStatus('');
        setFormErrors([]);
        setSelectedCategory('');
        setMappedDepartment('');
        setDuplicateCandidates([]);
        setStagedFormData(null);
        setStagedFormElement(null);
        alert(`Successfully backed complaint #CS-${candidateNo}! You will receive notifications as work progresses.`);
        setActiveTab('track');
    };

    const submitStagedGrievance = async (isPotentialDuplicate, parentId) => {
        if (!stagedFormData || !stagedFormElement) return;
        setIsSubmitting(true);
        const sendData = new FormData();
        for (const [key, value] of stagedFormData.entries()) {
            sendData.append(key, value);
        }
        sendData.append('is_potential_duplicate', isPotentialDuplicate ? 'true' : 'false');
        if (parentId) {
            sendData.append('parent_complaint_id', parentId);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/grievances/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: sendData
            });

            const data = await response.json();

            if (response.ok) {
                stagedFormElement.reset();
                setSelectedFiles([]);
                setDeviceCoords(null);
                setCoordsStatus('');
                setFormErrors([]);
                setSelectedCategory('');
                setMappedDepartment('');
                setDuplicateCandidates([]);
                setStagedFormData(null);
                setStagedFormElement(null);
                setSubmitSuccess({
                    show: true,
                    complaintId: data.complaintNumber || (1000 + Math.floor(Math.random() * 50))
                });
            } else {
                setFormErrors([data.message || 'Submission failed. Please try again.']);
                setDuplicateCandidates([]);
                setStagedFormData(null);
                setStagedFormElement(null);
            }
        } catch (err) {
            console.error('Network transport error:', err);
            setFormErrors(['Network error. Please check your connection and try again.']);
            setDuplicateCandidates([]);
            setStagedFormData(null);
            setStagedFormElement(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMergeTickets = async (childNo, parentNo) => {
        if (!childNo || !parentNo) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/grievances/${childNo}/merge`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ parentNo })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || `Merged #CS-${childNo} into #CS-${parentNo}`);

                const updater = item => {
                    if (item.complaint_no === childNo) {
                        return { ...item, status: 'Merged', parent_complaint_id: parentNo, merged_into_id: parentNo };
                    }
                    if (item.complaint_no === parentNo) {
                        return { ...item, vote_score: (item.vote_score || 0) + data.transferredVotes };
                    }
                    return item;
                };

                setAllGrievances(prev => prev.map(updater));
                setMyGrievances(prev => prev.map(updater));
                setSelectedTicket(prev => prev ? updater(prev) : null);
            } else {
                alert(data.error || 'Failed to merge tickets.');
            }
        } catch (err) {
            console.error('Merge error:', err);
            alert('Network error while merging tickets.');
        }
    };

    const fetchWhitelistedContractors = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/grievances/whitelisted-contractors`);
            const data = await res.json();
            if (res.ok && data.contractors) {
                setWhitelistedContractors(data.contractors);
            }
        } catch (err) {
            console.error('Failed to fetch whitelisted contractors:', err);
        }
    };

    useEffect(() => {
        fetchWhitelistedContractors();
    }, []);

    useEffect(() => {
        setSelectedParentNo('');
    }, [selectedTicket]);

    const handleAssignContractor = async (contractorEmail) => {
        if (!contractorEmail || !selectedTicket) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/assign-contractor`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ contractor_email: contractorEmail })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Contractor assigned successfully!');
                const updater = item => item.complaint_no === selectedTicket.complaint_no ? { ...item, assigned_contractor: contractorEmail } : item;
                setAllGrievances(prev => prev.map(updater));
                setMyGrievances(prev => prev.map(updater));
                setSelectedTicket(prev => prev ? { ...prev, assigned_contractor: contractorEmail } : null);
            } else {
                alert(data.error || 'Failed to assign contractor.');
            }
        } catch (err) {
            console.error('Assign contractor error:', err);
            alert('Network error assigning contractor.');
        }
    };

    // =============================================
    // SUPER ADMIN PANEL STATE
    // =============================================
    const [officials, setOfficials] = useState([]);
    const [loadingOfficials, setLoadingOfficials] = useState(false);
    const [officialsSearch, setOfficialsSearch] = useState('');
    const [officialsDeptFilter, setOfficialsDeptFilter] = useState('ALL');
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'Commissioner', department: 'MCC', wardAssignment: 'All Wards' });
    const [inviteStatus, setInviteStatus] = useState({ message: '', type: '' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [adminSubTab, setAdminSubTab] = useState('whitelist'); // 'whitelist' | 'official-stats' | 'ward-stats'
    const [selectedOfficialEmail, setSelectedOfficialEmail] = useState('');
    const [selectedAnalyticsWard, setSelectedAnalyticsWard] = useState('ALL');

    const handleDepartmentChange = (e) => {
        const newDept = e.target.value;
        const roles = DEPARTMENT_ROLES[newDept] || [];
        setInviteForm(prev => ({
            ...prev,
            department: newDept,
            role: roles[0] || '',
            wardAssignment: 'All Wards'
        }));
    };

    const fetchOfficials = async () => {
        setLoadingOfficials(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/officials`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) setOfficials(data.officials || []);
        } catch (err) {
            console.error('Failed to load officials:', err);
        } finally {
            setLoadingOfficials(false);
        }
    };

    const handleInviteOfficial = async (e) => {
        e.preventDefault();
        if (!inviteForm.email.trim()) return;
        setInviteLoading(true);
        setInviteStatus({ message: '', type: '' });
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/invite-official`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(inviteForm)
            });
            const data = await res.json();
            if (res.ok) {
                setInviteStatus({ message: data.message, type: 'success' });
                setInviteForm({ email: '', role: 'Commissioner', department: 'MCC', wardAssignment: 'All Wards' });
                fetchOfficials();
            } else {
                setInviteStatus({ message: data.message || 'Invite failed.', type: 'error' });
            }
        } catch (err) {
            setInviteStatus({ message: 'Network error.', type: 'error' });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevokeOfficial = async (email) => {
        if (!window.confirm(`Revoke access for ${email}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/officials/${encodeURIComponent(email)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setOfficials(prev => prev.filter(o => o.email !== email));
            }
        } catch (err) {
            console.error('Revoke failed:', err);
        }
    };

    // Load officials when admin panel tab is active
    useEffect(() => {
        if (activeTab === 'admin-panel' && userProfile.role === 'super_admin') {
            fetchOfficials();
        }
    }, [activeTab, userProfile.role]);

    // Fetch comments when a ticket is opened in the inspector
    useEffect(() => {
        if (!selectedTicket) {
            setTicketComments([]);
            setNewComment('');
            return;
        }
        const fetchComments = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/comments`);
                const data = await res.json();
                if (res.ok && data.comments) {
                    setTicketComments(data.comments);
                }
            } catch (err) {
                console.error('Failed to fetch comments:', err);
            }
        };
        fetchComments();
    }, [selectedTicket]);

    const handlePostComment = async () => {
        if (!newComment.trim() || !selectedTicket) return;
        setPostingComment(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ comment_text: newComment.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                // Re-fetch comments to get the new one with server timestamp
                const refetch = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/comments`);
                const refetchData = await refetch.json();
                if (refetch.ok) setTicketComments(refetchData.comments);
                setNewComment('');
            } else {
                alert(data.error || 'Failed to post comment.');
            }
        } catch (err) {
            console.error('Post comment error:', err);
            alert('Network error posting comment.');
        } finally {
            setPostingComment(false);
        }
    };

    // Profile verification token authentication loop
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);

            // Check if token has expired
            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
                console.log("Token has expired. Redirecting to login.");
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            const userRole = decoded.role || 'citizen';
            setUserProfile({
                name: decoded.name || decoded.NAME || 'Citizen',
                email: decoded.email || decoded.EMAIL || '',
                role: userRole,
                department: decoded.department || null,
                wardAssignment: decoded.ward_assignment || null
            });
            if (userRole !== 'citizen' && userRole !== 'super_admin') {
                if (userRole.toLowerCase().includes('contractor')) {
                    setActiveTab('contractor-jobs');
                } else {
                    setActiveTab('dept-jobs');
                }
            }
        } catch (err) {
            console.error("JWT Decoding failed:", err);
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    // Data lifecycle loop for Public Feed matrices
    useEffect(() => {
        if (activeTab !== 'view' && activeTab !== 'dept-jobs' && activeTab !== 'dept-resolved' && activeTab !== 'contractor-jobs' && activeTab !== 'contractor-completed') return;

        const fetchAllGrievances = async () => {
            setLoadingView(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/grievances/public-feed`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setAllGrievances(data.grievances || []);
                    setBackedTicketIds(data.userBacked || []);
                } else {
                    console.error("Failed to load global feed matrix.");
                }
            } catch (err) {
                console.error("Network synchronization fault:", err);
            } finally {
                setLoadingView(false);
            }
        };

        fetchAllGrievances();
    }, [activeTab]);

    // Data lifecycle loop for Tracking Pipelines
    useEffect(() => {
        if (activeTab !== 'track') return;

        const fetchMyGrievances = async () => {
            setLoadingTrack(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/grievances/my-logs`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setMyGrievances(data.grievances || []);
                } else {
                    console.error("Failed to fetch tracking records.");
                }
            } catch (err) {
                console.error("Network read fault on tracking pipeline:", err);
            } finally {
                setLoadingTrack(false);
            }
        };

        fetchMyGrievances();
    }, [activeTab]);

    const handleGrievanceUpvote = async (e, complaintNo) => {
        if (e) e.stopPropagation();
        if (!complaintNo) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/grievances/${complaintNo}/upvote`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Instantly sync upvote state scores across both feed arrays
                const updater = item => item.complaint_no === complaintNo ? { ...item, vote_score: data.newScore } : item;

                setAllGrievances(prev => prev.map(updater));
                setMyGrievances(prev => prev.map(updater));

                // Keep the detailed modal view open with the fresh incremental count
                setSelectedTicket(prev => prev && prev.complaint_no === complaintNo ? { ...prev, vote_score: data.newScore } : prev);
            } else {
                alert(data.error || 'Failed to back complaint');
            }
        } catch (err) {
            console.error("Failed to commit network upvote transaction:", err);
            alert("Failed to connect to the server.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const userInitial = userProfile.name && typeof userProfile.name === 'string'
        ? userProfile.name.charAt(0).toUpperCase()
        : 'C';

    const extractWardNumber = (wardStr) => {
        if (!wardStr) return null;
        const match = String(wardStr).match(/Ward\s+(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
    };

    const isNearbyAndSameCategory = (candidate, target) => {
        if (!candidate || !target) return false;
        if (candidate.complaint_no === target.complaint_no) return false;
        if (candidate.status === 'Merged' || candidate.status === 'Resolved') return false;

        // 1. Same Department or Category check
        const normalizeDept = (dept) => {
            const d = (dept || '').trim().toLowerCase();
            if (d.includes('mcc') || d.includes('civil') || d.includes('road')) return 'mcc';
            if (d.includes('water supply') || d.includes('sewage') || d.includes('water board')) return 'water board';
            if (d.includes('mescom') || d.includes('power')) return 'mescom';
            if (d.includes('stray') || d.includes('animal') || d.includes('health')) return 'health dept';
            if (d.includes('corporator') || d.includes('council')) return 'council';
            return d;
        };

        const candCat = (candidate.category || '').trim().toLowerCase();
        const targetCat = (target.category || '').trim().toLowerCase();

        const isSameCategory = (candCat && targetCat && candCat === targetCat) ||
            (normalizeDept(candidate.department) === normalizeDept(target.department));

        if (!isSameCategory) return false;

        // 2. Location Proximity Check (Same Ward, Ward Number, Landmark, or GPS Distance)
        const candWardNum = extractWardNumber(candidate.ward_number);
        const targetWardNum = extractWardNumber(target.ward_number);

        let isCloseBy = false;

        // A) Same Ward or Ward Number match
        if (candWardNum !== null && targetWardNum !== null && candWardNum === targetWardNum) {
            isCloseBy = true;
        } else if (candidate.ward_number && target.ward_number && candidate.ward_number.trim().toLowerCase() === target.ward_number.trim().toLowerCase()) {
            isCloseBy = true;
        }

        // B) Neighboring Ward (within 2 ward numbers)
        if (!isCloseBy && targetWardNum !== null && candWardNum !== null && Math.abs(candWardNum - targetWardNum) <= 2) {
            isCloseBy = true;
        }

        // C) Landmark matching
        if (!isCloseBy && candidate.landmark && target.landmark) {
            const cLand = candidate.landmark.trim().toLowerCase();
            const tLand = target.landmark.trim().toLowerCase();
            if (cLand.includes(tLand) || tLand.includes(cLand)) {
                isCloseBy = true;
            }
        }

        // D) GPS Distance Check (if lat/lng available, within 3 km)
        const cLat = parseFloat(candidate.latitude || candidate.lat);
        const cLng = parseFloat(candidate.longitude || candidate.lng);
        const tLat = parseFloat(target.latitude || target.lat);
        const tLng = parseFloat(target.longitude || target.lng);

        if (!isNaN(cLat) && !isNaN(cLng) && !isNaN(tLat) && !isNaN(tLng)) {
            const R = 6371; // km
            const dLat = (tLat - cLat) * (Math.PI / 180);
            const dLon = (tLng - cLng) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(cLat * (Math.PI / 180)) * Math.cos(tLat * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (R * c <= 3.0) {
                isCloseBy = true;
            }
        }

        return isCloseBy;
    };

    const filterOfficialTicket = (ticket) => {
        if (userProfile.role === 'super_admin') return true;

        const isContractor = userProfile.role && userProfile.role.toLowerCase().includes('contractor');
        if (isContractor) {
            return ticket.assigned_contractor && userProfile.email && ticket.assigned_contractor.toLowerCase().trim() === userProfile.email.toLowerCase().trim();
        }

        // Directly allow assigned contractor to view their assigned ticket
        if (ticket.assigned_contractor && userProfile.email && ticket.assigned_contractor.toLowerCase().trim() === userProfile.email.toLowerCase().trim()) {
            return true;
        }

        const ticketWard = (ticket.ward_number || '').trim().toLowerCase();
        const userWard = (userProfile.wardAssignment || '').trim().toLowerCase();

        const ticketWardNum = extractWardNumber(ticket.ward_number);
        const userWardNum = extractWardNumber(userProfile.wardAssignment);

        let isWardMatch = (userWard === 'all wards' ||
            (ticketWardNum !== null && userWardNum !== null && ticketWardNum === userWardNum) ||
            ticketWard === userWard);

        // Neighborhood alias match (e.g., "Bondel" landmark matching Wards 14, 15, 18)
        if (!isWardMatch && userWardNum !== null) {
            const userWardAliases = MANGALORE_WARD_ALIASES[userWardNum] || [];
            const ticketText = `${ticket.landmark || ''} ${ticket.description || ''} ${ticket.ward_number || ''}`.toLowerCase();
            if (userWardAliases.some(alias => ticketText.includes(alias))) {
                isWardMatch = true;
            }
        }

        if (!isWardMatch) return false;

        if (userProfile.role === 'Corporator') {
            return true;
        }

        const normalizeDept = (dept) => {
            const d = (dept || '').trim().toLowerCase();
            if (d.includes('mcc') || d.includes('mangaluru city corporation')) return 'mcc';
            if (d.includes('water supply') || d.includes('sewage') || d.includes('water board')) return 'water board';
            if (d.includes('mescom') || d.includes('power')) return 'mescom';
            if (d.includes('stray') || d.includes('animal') || d.includes('health')) return 'health dept';
            return d;
        };
        return normalizeDept(ticket.department) === normalizeDept(userProfile.department);
    };

    return (
        <div className="dashboard-layout-root">
            <header className="dashboard-brand-header">
                <h1 className="dashboard-main-logo">
                    {(userProfile.role !== 'citizen' && userProfile.role !== 'super_admin') ? 'CivicSense Department Portal' : 'CivicSense'}
                </h1>
                {userProfile.role === 'super_admin' && (
                    <span className="super-admin-badge">
                        Super Admin
                    </span>
                )}
                {(userProfile.role !== 'citizen' && userProfile.role !== 'super_admin') && (
                    <span className="department-badge" style={{ fontSize: '0.85rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: '700' }}>
                        {userProfile.department} ({userProfile.role})
                    </span>
                )}
            </header>

            <nav className="dashboard-navigation-bar">
                {userProfile.role === 'super_admin' ? (
                    <div className="dashboard-nav-tabs-group">
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'file' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('file')}
                        >
                            File Grievance
                        </button>
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'track' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('track')}
                        >
                            Track Grievance
                        </button>
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'view' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('view')}
                        >
                            View Grievances
                        </button>
                        <button
                            className={`dashboard-nav-tab-btn admin-tab-btn ${activeTab === 'admin-panel' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('admin-panel')}
                        >
                            Admin Panel
                        </button>
                    </div>
                ) : (userProfile.role !== 'citizen' && userProfile.role !== 'super_admin') ? (
                    <div className="dashboard-nav-tabs-group">
                        {userProfile.role.toLowerCase().includes('contractor') ? (
                            <>
                                <button
                                    className={`dashboard-nav-tab-btn ${activeTab === 'contractor-jobs' ? 'active-tab' : ''}`}
                                    onClick={() => setActiveTab('contractor-jobs')}
                                >
                                    Assigned Jobs
                                </button>
                                <button
                                    className={`dashboard-nav-tab-btn ${activeTab === 'contractor-completed' ? 'active-tab' : ''}`}
                                    onClick={() => setActiveTab('contractor-completed')}
                                >
                                    Completed Jobs
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={`dashboard-nav-tab-btn ${activeTab === 'dept-jobs' ? 'active-tab' : ''}`}
                                    onClick={() => setActiveTab('dept-jobs')}
                                >
                                    Pending Jobs
                                </button>
                                <button
                                    className={`dashboard-nav-tab-btn ${activeTab === 'dept-resolved' ? 'active-tab' : ''}`}
                                    onClick={() => setActiveTab('dept-resolved')}
                                >
                                    Resolved History
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="dashboard-nav-tabs-group">
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'file' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('file')}
                        >
                            File Grievance
                        </button>
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'track' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('track')}
                        >
                            Track Grievance
                        </button>
                        <button
                            className={`dashboard-nav-tab-btn ${activeTab === 'view' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('view')}
                        >
                            View Grievances
                        </button>
                    </div>
                )}

                <div className="dashboard-profile-hover-trigger">
                    <div className="dashboard-profile-anchor-row">
                        <span className="dashboard-profile-username">{userProfile.name}</span>
                        <div className="dashboard-profile-avatar-box">
                            {userInitial}
                        </div>
                    </div>

                    <div className="dashboard-profile-dropdown-menu">
                        <div className="dashboard-dropdown-header-info">
                            <p className="dropdown-info-name">{userProfile.name}</p>
                            <p className="dropdown-info-email">{userProfile.email || 'citizen@civicsense.in'}</p>
                            {(userProfile.role !== 'citizen' && userProfile.role !== 'super_admin') && (
                                <p className="dropdown-info-role" style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>
                                    {userProfile.role}
                                </p>
                            )}
                        </div>
                        <hr className="dashboard-dropdown-divider" />
                        {(userProfile.role === 'citizen' || userProfile.role === 'super_admin') && (
                            <>
                                <button className="dashboard-dropdown-item-btn" onClick={() => setActiveTab('profile-details')}>
                                    Profile Details
                                </button>
                                <button className="dashboard-dropdown-item-btn" onClick={() => setActiveTab('settings')}>
                                    Settings
                                </button>
                                <hr className="dashboard-dropdown-divider" />
                            </>
                        )}
                        <button className="dashboard-dropdown-item-btn dropdown-logout-action" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="dashboard-viewport-workspace">

                {activeTab === 'file' && (
                    <div className="dashboard-form-container-card">
                        <div className="form-card-header">
                            <h2>Lodge a Public Complaint</h2>
                            <p>Submit precise field telemetry below to dispatch local municipal emergency vectors.</p>
                        </div>

                        <form className="grievance-submission-form" onSubmit={async (e) => {
                            e.preventDefault();

                            // --- Client-side Validation ---
                            const errors = [];

                            if (!selectedCategory) {
                                errors.push('Please select the Type of Issue / Category.');
                            }

                            // Rule 1: At least one photo must be attached
                            const hasPhoto = selectedFiles.some(f => f.type.startsWith('image/'));
                            if (!hasPhoto) {
                                errors.push('A photo of the issue is required. Please attach at least one image.');
                            }

                            // Rule 2: Location must be provided — either via GPS button or the uploaded photo may have EXIF GPS.
                            // If a photo is attached, server will attempt EXIF extraction, so we only hard-block if NO photo AND NO device coords.
                            if (!hasPhoto && !deviceCoords) {
                                errors.push('Location is required. Please tap "Share Phone Location" to share your GPS location.');
                            }
                            // If photo uploaded but no device GPS, warn (soft) but allow — EXIF may cover it
                            // We already require the photo above, so this handles the location implicitly

                            if (errors.length > 0) {
                                setFormErrors(errors);
                                // Scroll to top of form
                                document.querySelector('.grievance-submission-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                return;
                            }

                            setFormErrors([]);
                            setIsSubmitting(true);

                            const formData = new FormData(e.target);
                            formData.delete('media');

                            selectedFiles.forEach((fileWrapper) => {
                                formData.append('media', fileWrapper.fileObject);
                            });

                            if (deviceCoords) {
                                formData.append('latitude', deviceCoords.latitude);
                                formData.append('longitude', deviceCoords.longitude);
                            }

                            if (aiSummaryStatus) {
                                formData.append('ai_summary_status', aiSummaryStatus);
                            }

                            try {
                                const response = await fetch(`${API_BASE_URL}/api/grievances/submit`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    },
                                    body: formData
                                });

                                const data = await response.json();

                                if (response.ok) {
                                    if (data.success === false && data.duplicateDetected) {
                                        setDuplicateCandidates(data.duplicates);
                                        setStagedFormData(formData);
                                        setStagedFormElement(e.target);
                                        setIsSubmitting(false);
                                        return;
                                    }
                                    e.target.reset();
                                    setSelectedFiles([]);
                                    setDeviceCoords(null);
                                    setCoordsStatus('');
                                    setFormErrors([]);
                                    setSelectedCategory('');
                                    setMappedDepartment('');
                                    setAiAnalysisResult(null);
                                    setAiSummaryStatus(null);
                                    setCustomDescriptionText('');
                                    setSubmitSuccess({
                                        show: true,
                                        complaintId: data.complaintNumber || (1000 + Math.floor(Math.random() * 50))
                                    });
                                } else {
                                    setFormErrors([data.message || 'Submission failed. Please try again.']);
                                }
                            } catch (err) {
                                console.error('Network transport error:', err);
                                setFormErrors(['Network error. Please check your connection and try again.']);
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}>

                            {/* Validation Error Banner */}
                            {formErrors.length > 0 && (
                                <div className="form-validation-error-banner">
                                    <strong>Please fix the following before submitting:</strong>
                                    <ul className="form-error-list">
                                        {formErrors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* REQUIRED: Photo upload */}
                            <div className="form-field-element">
                                <label>
                                    Photo of the Issue
                                    <span className="field-required-badge">Required</span>
                                </label>
                                <div className="multimedia-upload-dropzone">
                                    <input
                                        type="file"
                                        id="mediaAttachment"
                                        name="media"
                                        accept="image/*,video/*"
                                        multiple
                                        className="hidden-file-input"
                                        onChange={(e) => {
                                            if (!e.target.files.length) return;
                                            const newFiles = Array.from(e.target.files);
                                            const newFilesWithPreviews = newFiles.map(file => ({
                                                fileObject: file,
                                                name: file.name,
                                                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                                                type: file.type,
                                                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                                            }));
                                            setSelectedFiles(prevFiles => [...prevFiles, ...newFilesWithPreviews]);
                                            setFormErrors(prev => prev.filter(e => !e.toLowerCase().includes('photo')));
                                            e.target.value = "";

                                            const firstImg = newFiles.find(f => f.type.startsWith('image/'));
                                            if (firstImg) {
                                                runAIImageAnalysis(firstImg);
                                            }
                                        }}
                                    />
                                    <label htmlFor="mediaAttachment" className="custom-upload-trigger-label">
                                        <span>Click to upload a photo of the civic issue</span>
                                        <span className="upload-constraints-caption">JPEG, PNG required for AI classification · Max 25MB</span>
                                    </label>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="media-preview-deck-container">
                                        <div className="preview-deck-header">
                                            <span>Staged Attachments ({selectedFiles.length})</span>
                                            <button
                                                type="button"
                                                className="clear-deck-btn"
                                                onClick={() => {
                                                    setSelectedFiles([]);
                                                    setAiAnalysisResult(null);
                                                    setAiSummaryStatus(null);
                                                }}
                                            >
                                                Remove All
                                            </button>
                                        </div>
                                        <div className="media-preview-grid">
                                            {selectedFiles.map((fileObj, index) => (
                                                <div key={index} className="media-preview-card" style={{ position: 'relative' }}>
                                                    <button
                                                        type="button"
                                                        className="individual-remove-btn"
                                                        onClick={() => {
                                                            const remaining = selectedFiles.filter((_, i) => i !== index);
                                                            setSelectedFiles(remaining);
                                                            if (!remaining.some(f => f.type.startsWith('image/'))) {
                                                                setAiAnalysisResult(null);
                                                                setAiSummaryStatus(null);
                                                            }
                                                        }}
                                                    >
                                                        x
                                                    </button>
                                                    {fileObj.previewUrl ? (
                                                        <img src={fileObj.previewUrl} alt="Preview" className="thumb-graphic" />
                                                    ) : (
                                                        <div className="video-thumb-icon-box">Video Preview</div>
                                                    )}
                                                    <div className="media-card-meta">
                                                        <p className="media-meta-name" title={fileObj.name}>{fileObj.name}</p>
                                                        <p className="media-meta-size">{fileObj.size}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI Image Analysis & Summary Accept/Reject Provision Card */}
                            {selectedFiles.some(f => f.type.startsWith('image/')) && (
                                <div className="ai-summary-provision-box" style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                                    border: '1px solid rgba(99, 102, 241, 0.25)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            CivicSense AI Model Problem Summary
                                        </h4>
                                        {!aiAnalysisResult && !aiAnalysisLoading && (
                                            <button
                                                type="button"
                                                className="ai-trigger-btn"
                                                style={{
                                                    padding: '6px 14px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    borderRadius: '6px',
                                                    background: 'var(--brand-primary)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    const img = selectedFiles.find(f => f.type.startsWith('image/'));
                                                    if (img) runAIImageAnalysis(img.fileObject);
                                                }}
                                            >
                                                Re-analyze Photo with AI
                                            </button>
                                        )}
                                    </div>

                                    {aiAnalysisLoading && (
                                        <div style={{ margin: '12px 0', fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="spinner-loader">⏳</span> Processing image with Gemini AI vision model...
                                        </div>
                                    )}

                                    {aiAnalysisResult && (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '0.82rem' }}>
                                                <span style={{ background: 'rgba(99,102,241,0.15)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', color: 'var(--brand-primary)' }}>
                                                    Category: {aiAnalysisResult.issue_detected}
                                                </span>
                                                <span style={{ background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', color: '#16a34a' }}>
                                                    Dept: {aiAnalysisResult.department}
                                                </span>
                                                <span style={{ background: 'rgba(234,88,12,0.15)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', color: '#ea580c' }}>
                                                    Severity: {aiAnalysisResult.severity ? aiAnalysisResult.severity.split(' ')[0] : 'Medium'}
                                                </span>
                                            </div>

                                            <div style={{ background: 'var(--card-bg)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '12px' }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                                                    <strong>AI Generated Problem Summary:</strong> "{aiAnalysisResult.description}"
                                                </p>
                                            </div>

                                            {aiSummaryStatus === 'accepted' && (
                                                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', color: '#15803d', fontSize: '0.82rem', fontWeight: '700', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span> AI Problem Summary Accepted & Applied to Complaint</span>
                                                    <button type="button" onClick={() => { setAiSummaryStatus(null); setShowRejectionInput(false); }} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.78rem' }}>Change Choice</button>
                                                </div>
                                            )}

                                            {aiSummaryStatus === 'rejected' && !showRejectionInput && (
                                                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#b91c1c', fontSize: '0.82rem', fontWeight: '700', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span> AI Summary Rejected (Using Custom Description & Category)</span>
                                                    <button type="button" onClick={() => { setAiSummaryStatus(null); setShowRejectionInput(true); }} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.78rem' }}>Provide Feedback to AI</button>
                                                </div>
                                            )}

                                            {showRejectionInput && (
                                                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '10px' }}>
                                                    <p style={{ margin: '0 0 6px 0', fontSize: '0.83rem', fontWeight: '700', color: '#b91c1c' }}>
                                                        What was incorrect or missing in the AI summary?
                                                    </p>
                                                    <textarea
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.83rem', marginBottom: '10px' }}
                                                        rows="2"
                                                        value={rejectionFeedbackText}
                                                        onChange={(e) => setRejectionFeedbackText(e.target.value)}
                                                        placeholder="e.g. 'It is a fallen electric pole, not a road pothole' or 'The manhole cover is broken'"
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button
                                                            type="button"
                                                            style={{ flex: 1, padding: '8px 12px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                const img = selectedFiles.find(f => f.type.startsWith('image/'));
                                                                if (img) runAIImageAnalysis(img.fileObject, rejectionFeedbackText, aiAnalysisResult.description);
                                                            }}
                                                        >
                                                            Regenerate Refined AI Summary
                                                        </button>
                                                        <button
                                                            type="button"
                                                            style={{ padding: '8px 12px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                setAiSummaryStatus('rejected');
                                                                setShowRejectionInput(false);
                                                            }}
                                                        >
                                                            Skip & Enter Manually
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {!aiSummaryStatus && !showRejectionInput && (
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                    <button
                                                        type="button"
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 14px',
                                                            background: '#16a34a',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 6px rgba(22,163,74,0.2)'
                                                        }}
                                                        onClick={() => {
                                                            setAiSummaryStatus('accepted');
                                                            setSelectedCategory(aiAnalysisResult.issue_detected);
                                                            setMappedDepartment(aiAnalysisResult.department);
                                                            setCustomDescriptionText(aiAnalysisResult.description);
                                                        }}
                                                    >
                                                        Accept AI Summary
                                                    </button>
                                                    <button
                                                        type="button"
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 14px',
                                                            background: '#dc2626',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 6px rgba(220,38,38,0.2)'
                                                        }}
                                                        onClick={() => {
                                                            setShowRejectionInput(true);
                                                        }}
                                                    >
                                                        ❌ Reject AI Summary
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* REQUIRED: Type of Issue / Category */}
                            <div className="form-field-element">
                                <label htmlFor="issueCategory">
                                    Type of Issue / Category
                                    <span className="field-required-badge">Required</span>
                                </label>
                                <select
                                    id="issueCategory"
                                    name="category"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        setSelectedCategory(cat);
                                        const dept = categoryToDepartmentMap[cat] || '';
                                        setMappedDepartment(dept);
                                        setFormErrors(prev => prev.filter(e => !e.toLowerCase().includes('category')));
                                    }}
                                    className="admin-select"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                                    required
                                >
                                    <option value="">-- Select Category --</option>
                                    <optgroup label="MCC (Structural & Infrastructure)">
                                        <option value="Potholes and Road Damage">Potholes and Road Damage</option>
                                        <option value="Footpath and Pedestrian Hazards">Footpath and Pedestrian Hazards</option>
                                        <option value="Open Drains and Stormwater Overflows">Open Drains and Stormwater Overflows</option>
                                        <option value="Public Parks and Playgrounds">Public Parks and Playgrounds</option>
                                    </optgroup>
                                    <optgroup label="Water Supply & Sewage Board (Pipelines & Water Distribution)">
                                        <option value="Water Main Leaks / Pipe Bursts">Water Main Leaks / Pipe Bursts</option>
                                        <option value="Contaminated Water Supply">Contaminated Water Supply</option>
                                        <option value="Overflowing or Blocked Manholes">Overflowing or Blocked Manholes</option>
                                        <option value="Missing Manhole Covers">Missing Manhole Covers</option>
                                    </optgroup>
                                    <optgroup label="MESCOM (Electrical Infrastructure & Grid Safety)">
                                        <option value="Sparking Transformers / Substation Faults">Sparking Transformers / Substation Faults</option>
                                        <option value="Fallen or Low-Hanging Power Lines">Fallen or Low-Hanging Power Lines</option>
                                        <option value="Frequent or Unannounced Power Outages">Frequent or Unannounced Power Outages</option>
                                        <option value="Damaged Utility Poles">Damaged Utility Poles</option>
                                    </optgroup>
                                    <optgroup label="Stray / Animal Welfare & Health Dept (Sanitation & Animal Control)">
                                        <option value="Stray Animal Menace">Stray Animal Menace</option>
                                        <option value="Injured or Abandoned Cattle">Injured or Abandoned Cattle</option>
                                        <option value="Illegal Garbage Dumping">Illegal Garbage Dumping</option>
                                        <option value="Pest / Vector-Borne Outbreaks">Pest / Vector-Borne Outbreaks</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Mapped target department display */}
                            {mappedDepartment && (
                                <div className="form-field-element">
                                    <label htmlFor="displayDepartment">Target Department</label>
                                    <input
                                        type="text"
                                        id="displayDepartment"
                                        value={mappedDepartment}
                                        disabled
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'not-allowed', width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}
                                    />
                                    <input type="hidden" name="department" value={mappedDepartment} />
                                </div>
                            )}

                            {/* REQUIRED: GPS Location */}
                            <div className="form-field-element location-coordinates-field">
                                <label>
                                    Your Location (GPS)
                                    <span className="field-required-badge">Required</span>
                                </label>
                                <div className="location-permission-trigger-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className={`location-permission-btn ${deviceCoords ? 'location-acquired' : ''}`}
                                        onClick={() => {
                                            acquireLocation();
                                            setFormErrors(prev => prev.filter(e => !e.toLowerCase().includes('location')));
                                        }}
                                    >
                                        {deviceCoords ? 'Location Acquired' : 'Share Phone Location'}
                                    </button>
                                    <span className="location-acquisition-status-label" style={{ fontSize: '0.85rem', fontWeight: '600', color: deviceCoords ? '#22c55e' : 'var(--text-main)' }}>
                                        {coordsStatus || 'No location linked yet.'}
                                    </span>
                                </div>
                                <p className="location-constraint-tip" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                                    Tap the button to share your device GPS. Your location is used to tag the correct ward and route the complaint to the right department.
                                </p>
                            </div>

                            {/* OPTIONAL: Nearby Landmark */}
                            <div className="form-field-element">
                                <label htmlFor="landmark">Nearby Landmark / Location Area <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(Optional)</span></label>
                                <input
                                    type="text"
                                    id="landmark"
                                    name="landmark"
                                    placeholder="e.g. Near Bejai Church, Lalbagh"
                                />
                            </div>


                            <div className="form-field-element">
                                <label htmlFor="description">Problem Summary / Additional Comments</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    value={customDescriptionText}
                                    onChange={(e) => setCustomDescriptionText(e.target.value)}
                                    placeholder="Provide any additional comments, landmarks, or details about the issue..."
                                />
                            </div>

                            <div className="form-field-element dynamic-checkbox-field">
                                <label>Notification Preference</label>
                                <div className="checkbox-wrapper-row">
                                    <input
                                        type="checkbox"
                                        id="whatsappConsent"
                                        name="whatsappConsent"
                                        value="true"
                                    />
                                    <label htmlFor="whatsappConsent" className="checkbox-caption">
                                        Allow field engineers to contact me via WhatsApp updates
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="form-dispatch-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
                            </button>
                        </form>
                    </div>
                )}

                {submitSuccess.show && (
                    <div className="success-modal-overlay">
                        <div className="success-modal-card">
                            <div className="success-modal-icon"></div>
                            <h2>Grievance Registered Successfully</h2>
                            <p className="success-modal-thanks">Thank you for submitting your concern. Citizens like you help make Mangaluru better.</p>

                            <div className="complaint-id-display-zone">
                                <span className="complaint-id-title">YOUR COMPLAINT NUMBER</span>
                                <h3 className="complaint-id-digits">#CS-{submitSuccess.complaintId}</h3>
                            </div>

                            <p className="success-modal-caption">Please reference this ID to check workflow logs in the tracking dashboard.</p>

                            <button
                                className="success-modal-close-btn"
                                onClick={() => {
                                    setSubmitSuccess({ show: false, complaintId: null });
                                    setActiveTab('track');
                                }}
                            >
                                Proceed to Tracking Grid
                            </button>
                        </div>
                    </div>
                )}

                {duplicateCandidates.length > 0 && (
                    <div className="duplicate-modal-overlay">
                        <div className="duplicate-modal-card">
                            <div className="duplicate-modal-header">
                                <h3 className="duplicate-modal-title">Nearby Issue Detected</h3>
                            </div>
                            <div className="duplicate-modal-body">
                                <p className="duplicate-modal-caption">
                                    We found existing open tickets reported very close to your location. To help crews resolve issues faster, please verify if your issue is already listed below:
                                </p>
                                <div className="duplicate-candidates-list">
                                    {duplicateCandidates.map((ticket) => {
                                        const thumb = ticket.media_attachments ? ticket.media_attachments.split(',')[0].trim() : null;
                                        return (
                                            <div key={ticket.complaint_no} className="duplicate-candidate-card">
                                                {thumb ? (
                                                    <img src={thumb} alt="Preview" className="duplicate-candidate-thumb" />
                                                ) : (
                                                    <div className="duplicate-candidate-thumb-placeholder">Image</div>
                                                )}
                                                <div className="duplicate-candidate-info">
                                                    <div className="duplicate-candidate-meta-row">
                                                        <span className="duplicate-candidate-distance">{Math.round(ticket.distance)} meters away</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>#CS-{ticket.complaint_no}</span>
                                                    </div>
                                                    <p className="duplicate-candidate-desc">{ticket.description}</p>
                                                    <div className="duplicate-candidate-footer">
                                                        <span>Category: {ticket.department}</span>
                                                        <span>{ticket.vote_score || 0} backers</span>
                                                    </div>
                                                    <div className="duplicate-candidate-actions">
                                                        <button
                                                            type="button"
                                                            className="duplicate-back-btn"
                                                            onClick={() => handleBackDuplicate(ticket.complaint_no)}
                                                        >
                                                            Yes, Same Issue — Back It (+1 Upvote)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="duplicate-modal-footer-actions">
                                <button
                                    type="button"
                                    className="duplicate-btn-secondary"
                                    onClick={() => {
                                        setDuplicateCandidates([]);
                                        setStagedFormData(null);
                                        setStagedFormElement(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="duplicate-btn-primary"
                                    onClick={() => {
                                        const parentId = duplicateCandidates[0]?.complaint_no || null;
                                        submitStagedGrievance(true, parentId);
                                    }}
                                >
                                    Reject All — Lodge New Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'track' && (
                    <div className="dashboard-tracking-container">
                        <div className="tracking-view-header">
                            <h2>Track Your Active Grievances</h2>
                            <p>Monitor live workflow routing and response status tokens assigned by municipal vectors.</p>
                        </div>

                        {loadingTrack ? (
                            <div className="tracking-status-fallback">Synchronizing live ledger pipelines...</div>
                        ) : myGrievances.length === 0 ? (
                            <div className="tracking-status-fallback empty-ledger">
                                <p>No grievances found under your profile identity hash.</p>
                            </div>
                        ) : (
                            <div className="tracking-logs-grid">
                                {myGrievances.map((ticket, idx) => (
                                    <div
                                        key={ticket.complaint_no || idx}
                                        className="tracking-ticket-card interactive-clickable-card"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className="ticket-card-top-row">
                                            <div className="card-top-row-metadata-left" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span className="ticket-id-badge">#CS-{ticket.complaint_no}</span>
                                                <span className={`status-pill-token status-${String(ticket.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {ticket.status || 'Pending'}
                                                </span>
                                                {ticket.is_potential_duplicate && (
                                                    <span className="potential-duplicate-badge">Duplicate Review</span>
                                                )}
                                                {ticket.merged_into_id && (
                                                    <span className="merged-badge">Merged</span>
                                                )}
                                            </div>
                                            <span className="card-upvote-preview-count">{ticket.vote_score || 0} backers</span>
                                        </div>

                                        <h3 className="ticket-department-title">{ticket.department}</h3>

                                        {ticket.landmark && (
                                            <p className="ticket-landmark-caption">
                                                <strong>Location:</strong> {ticket.landmark}
                                            </p>
                                        )}

                                        <p className="ticket-description-text">{ticket.description}</p>

                                        <div className="ticket-card-footer-row">
                                            <span className="ticket-date-stamp">
                                                Filed: {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="ticket-severity-tag">{ticket.severity ? ticket.severity.split(' ')[0] : 'Low'} Priority</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'view' && (
                    <div className="dashboard-tracking-container">
                        <div className="tracking-view-header">
                            <h2>Public Grievance Map & Feed</h2>
                            <p>Review community-logged concerns and maintenance telemetry deployed across city zones.</p>
                        </div>

                        {loadingView ? (
                            <div className="tracking-status-fallback">Synchronizing public ledger matrices...</div>
                        ) : allGrievances.length === 0 ? (
                            <div className="tracking-status-fallback empty-ledger">
                                <p>The community ledger is currently clear.</p>
                            </div>
                        ) : (
                            <div className="tracking-logs-grid">
                                {allGrievances.map((ticket, idx) => (
                                    <div
                                        key={ticket.id || ticket.complaint_no || idx}
                                        className="tracking-ticket-card public-feed-card interactive-clickable-card"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className="ticket-card-top-row">
                                            <div className="card-top-row-metadata-left" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span className="ticket-id-badge">{ticket.ward_number}</span>
                                                <span className={`status-pill-token status-${String(ticket.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {ticket.status || 'Pending'}
                                                </span>
                                                {ticket.is_potential_duplicate && (
                                                    <span className="potential-duplicate-badge">Duplicate Review</span>
                                                )}
                                                {ticket.merged_into_id && (
                                                    <span className="merged-badge">Merged</span>
                                                )}
                                            </div>
                                            <span className="card-upvote-preview-count">{ticket.vote_score || 0} backing</span>
                                        </div>

                                        <h3 className="ticket-department-title">{ticket.department}</h3>

                                        {ticket.landmark && (
                                            <p className="ticket-landmark-caption">
                                                <strong>Location:</strong> {ticket.landmark}
                                            </p>
                                        )}

                                        <p className="ticket-description-text">{ticket.description}</p>

                                        {ticket.media_attachments && (
                                            <div className="public-feed-media-gallery">
                                                {ticket.media_attachments.split(',').map((url, idx) => (
                                                    <div key={idx} className="feed-media-frame" onClick={(e) => e.stopPropagation()}>
                                                        {url.match(/\.(mp4|mov|webm)$/i) || url.includes('/video/upload/') ? (
                                                            <video src={url} controls className="feed-media-asset" />
                                                        ) : (
                                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                                <img src={url} alt="Field Evidence" className="feed-media-asset" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="ticket-card-footer-row">
                                            <span className="ticket-date-stamp">
                                                Reported: {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="ticket-severity-tag">Ticket #CS-{ticket.complaint_no}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Department Portal views */}
                {(activeTab === 'dept-jobs' || activeTab === 'dept-resolved' || activeTab === 'contractor-jobs' || activeTab === 'contractor-completed') && (
                    <div className="dashboard-tracking-container">
                        <div className="tracking-view-header">
                            <h2>
                                {activeTab === 'dept-jobs' && 'Actionable Department Tickets'}
                                {activeTab === 'dept-resolved' && 'Historical Resolutions Ledger'}
                                {activeTab === 'contractor-jobs' && 'Assigned Actionable Jobs'}
                                {activeTab === 'contractor-completed' && 'Completed/Historical Jobs'}
                            </h2>
                            <p>
                                {activeTab.startsWith('contractor')
                                    ? `Manage jobs assigned to you (${userProfile.role}). Mark them as completed when work is done.`
                                    : `Manage grievances assigned to ${userProfile.department}. Upload completion proof photos to resolve assigned complaints.`}
                            </p>
                        </div>

                        {loadingView ? (
                            <div className="tracking-status-fallback">Synchronizing department ledger...</div>
                        ) : allGrievances.filter(filterOfficialTicket).filter(t => {
                            const st = String(t.status || 'Pending').toLowerCase();
                            if (activeTab === 'contractor-jobs') {
                                return st === 'pending' || st === 'in progress';
                            }
                            if (activeTab === 'contractor-completed') {
                                return st === 'pending verification' || st === 'resolved';
                            }
                            return activeTab === 'dept-jobs' ? st === 'pending' : (st === 'pending verification' || st === 'resolved');
                        }).length === 0 ? (
                            <div className="tracking-status-fallback empty-ledger">
                                <p>No grievances found matching this status filter.</p>
                            </div>
                        ) : (
                            <div className="tracking-logs-grid">
                                {allGrievances.filter(filterOfficialTicket).filter(t => {
                                    const st = String(t.status || 'Pending').toLowerCase();
                                    if (activeTab === 'contractor-jobs') {
                                        return st === 'pending' || st === 'in progress';
                                    }
                                    if (activeTab === 'contractor-completed') {
                                        return st === 'pending verification' || st === 'resolved';
                                    }
                                    return activeTab === 'dept-jobs' ? st === 'pending' : (st === 'pending verification' || st === 'resolved');
                                }).map((ticket, idx) => (
                                    <div
                                        key={ticket.id || ticket.complaint_no || idx}
                                        className="tracking-ticket-card public-feed-card interactive-clickable-card"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className="ticket-card-top-row">
                                            <div className="card-top-row-metadata-left" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span className="ticket-id-badge">#CS-{ticket.complaint_no}</span>
                                                <span className={`status-pill-token status-${String(ticket.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {ticket.status || 'Pending'}
                                                </span>
                                                {ticket.is_potential_duplicate && (
                                                    <span className="potential-duplicate-badge">Duplicate Review</span>
                                                )}
                                                {ticket.merged_into_id && (
                                                    <span className="merged-badge">Merged</span>
                                                )}
                                            </div>
                                            <span className="card-upvote-preview-count">{ticket.vote_score || 0} Backers</span>
                                        </div>

                                        <h3 className="ticket-department-title">{ticket.ward_number}</h3>

                                        {ticket.landmark && (
                                            <p className="ticket-landmark-caption">
                                                <strong>Location:</strong> {ticket.landmark}
                                            </p>
                                        )}

                                        <p className="ticket-description-text">{ticket.description}</p>

                                        <div className="ticket-card-footer-row">
                                            <span className="ticket-date-stamp">
                                                Reported: {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="ticket-severity-tag">{ticket.severity ? ticket.severity.split(' ')[0] : 'Low'} Priority</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {selectedTicket && (
                    <div className="success-modal-overlay" onClick={() => setSelectedTicket(null)}>
                        <div className="detailed-inspection-card" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-corner-close-x" onClick={() => setSelectedTicket(null)}>x</button>

                            <div className="inspection-card-header" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="ticket-id-badge">#CS-{selectedTicket.complaint_no}</span>
                                <span className={`status-pill-token status-${String(selectedTicket.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                    {selectedTicket.status || 'Pending'}
                                </span>
                                {selectedTicket.is_potential_duplicate && (
                                    <span className="potential-duplicate-badge">Duplicate Review</span>
                                )}
                                {selectedTicket.merged_into_id && (
                                    <span className="merged-badge">Merged</span>
                                )}
                            </div>

                            <div className="inspection-title-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <h2 className="inspection-main-title" style={{ margin: 0 }}>{selectedTicket.department}</h2>
                                {userProfile.role === 'citizen' && (
                                    <div className="inspection-header-upvote-zone">
                                        {backedTicketIds.includes(selectedTicket.complaint_no) ? (
                                            <button type="button" className="modal-embedded-upvote-btn already-backed-lock-btn" disabled>
                                                Backed Issue
                                            </button>
                                        ) : (selectedTicket.complainee_email && userProfile.email && String(selectedTicket.complainee_email).toLowerCase().trim() === String(userProfile.email).toLowerCase().trim()) ? (
                                            <button type="button" className="modal-embedded-upvote-btn already-backed-lock-btn" style={{ background: '#94a3b8', color: '#ffffff', cursor: 'not-allowed' }} disabled>
                                                Your Own Issue
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="modal-embedded-upvote-btn"
                                                onClick={(e) => {
                                                    handleGrievanceUpvote(e, selectedTicket.complaint_no);
                                                    setBackedTicketIds(prev => [...prev, selectedTicket.complaint_no]);
                                                }}
                                            >
                                                Back This Issue
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="inspection-zone-sub" style={{ marginTop: '4px' }}>Target Zone Area: <strong>{selectedTicket.ward_number}</strong></p>

                            <hr className="dashboard-dropdown-divider" style={{ margin: '12px 0' }} />

                            <div className="inspection-scrollable-body">
                                <div className="inspection-data-segment">
                                    <h4>Detailed Structural Description</h4>
                                    <p className="inspection-body-text-box">{selectedTicket.description}</p>
                                </div>

                                <div className="inspection-meta-grid">
                                    <div className="meta-grid-item">
                                        <span className="meta-grid-label">Location</span>
                                        <span className="meta-grid-value">{selectedTicket.landmark || 'None specified'}</span>
                                    </div>
                                    {selectedTicket.location_type && (
                                        <div className="meta-grid-item">
                                            <span className="meta-grid-label">Location Type</span>
                                            <span className="meta-grid-value" style={{ textTransform: 'capitalize' }}>
                                                {selectedTicket.location_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedTicket.issue_size && (
                                        <div className="meta-grid-item">
                                            <span className="meta-grid-label">Issue Scale</span>
                                            <span className="issue-size-badge" style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: '600' }}>
                                                {selectedTicket.issue_size}
                                            </span>
                                        </div>
                                    )}
                                    <div className="meta-grid-item">
                                        <span className="meta-grid-label">Urgency Matrix</span>
                                        <span className="meta-grid-value">{selectedTicket.severity || 'Low Priority'}</span>
                                    </div>
                                    <div className="meta-grid-item">
                                        <span className="meta-grid-label">Alternate Contact</span>
                                        <span className="meta-grid-value">{selectedTicket.alternate_phone || selectedTicket.altPhone || 'Not provided'}</span>
                                    </div>

                                    <div className="meta-grid-item">
                                        <span className="meta-grid-label">Community Endorsement</span>
                                        <span className="meta-grid-value">
                                            {(selectedTicket.vote_score || 0) + (backedTicketIds.includes(selectedTicket.complaint_no) ? 1 : 0)} Backers
                                        </span>
                                    </div>

                                    <div className="meta-grid-item">
                                        <span className="meta-grid-label">Assigned Contractor</span>
                                        <span className="meta-grid-value" style={{ fontWeight: '600', color: selectedTicket.assigned_contractor ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                                            {selectedTicket.assigned_contractor ? `👷 ${selectedTicket.assigned_contractor}` : 'Unassigned'}
                                        </span>
                                    </div>
                                </div>

                                {/* Official Contractor Assignment Control */}
                                {(userProfile.role !== 'citizen' || userProfile.role === 'super_admin') && (
                                    <div className="inspection-data-segment" style={{ marginTop: '14px', padding: '14px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--card-border)' }}>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>Assign Contractor / Field Worker</h4>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                            Assign a whitelisted contractor or field worker from the admin whitelist:
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                className="admin-select"
                                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                                                value={selectedTicket.assigned_contractor || ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleAssignContractor(e.target.value);
                                                    }
                                                }}
                                            >
                                                <option value="">-- Select Whitelisted Contractor --</option>
                                                {whitelistedContractors.map(c => (
                                                    <option key={c.id || c.email} value={c.email}>
                                                        {c.email} ({c.role} — {c.department || 'General'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Ticket Merging Control */}
                                {(userProfile.role !== 'citizen' || userProfile.role === 'super_admin') && (
                                    <div className="inspection-data-segment" style={{ marginTop: '14px', padding: '14px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.05)', border: '1px solid #fed7aa' }}>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#ea580c' }}>Merge Duplicate Ticket</h4>

                                        {selectedTicket.status === 'Merged' || selectedTicket.merged_into_id ? (
                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', margin: '4px 0 0 0' }}>
                                                Merged: This ticket is linked into Master Ticket #CS-{selectedTicket.parent_complaint_id || selectedTicket.merged_into_id}.
                                            </p>
                                        ) : (
                                            <>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                                    Select a master parent ticket to merge this duplicate ticket into:
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <select
                                                        className="admin-select"
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                                                        value={selectedParentNo}
                                                        onChange={(e) => setSelectedParentNo(e.target.value)}
                                                    >
                                                        <option value="">-- Select Master Ticket (Nearby & Same Department) --</option>
                                                        {allGrievances
                                                            .filter(t => isNearbyAndSameCategory(t, selectedTicket))
                                                            .map(t => (
                                                                <option key={t.complaint_no} value={t.complaint_no}>
                                                                    #CS-{t.complaint_no} - {t.landmark || t.ward_number} ({(t.description || '').substring(0, 40)}...)
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        style={{ padding: '8px 16px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
                                                        disabled={!selectedParentNo}
                                                        onClick={() => handleMergeTickets(selectedTicket.complaint_no, selectedParentNo)}
                                                    >
                                                        Merge
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Contractor Mark Work as Done Panel */}
                                {(userProfile.role && userProfile.role.toLowerCase().includes('contractor')) &&
                                    (String(selectedTicket.status || '').toLowerCase() === 'pending' || String(selectedTicket.status || '').toLowerCase() === 'in progress') && (
                                        <div className="inspection-data-segment simulator-box" style={{ borderStyle: 'solid', borderColor: 'var(--brand-primary)' }}>
                                            <h4>Mark Work as Done</h4>
                                            <p>
                                                Notify officials and the citizen that you have completed this job. The ticket status will update to "Pending Verification".
                                            </p>
                                            <button
                                                type="button"
                                                className="simulator-trigger-btn"
                                                style={{ display: 'block', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/contractor-complete`, {
                                                            method: 'PATCH',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                            }
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            alert('Job marked as completed! Notification emails simulated to officials and citizen.');
                                                            const updater = item => item.complaint_no === selectedTicket.complaint_no ? { ...item, status: 'Pending Verification' } : item;
                                                            setAllGrievances(prev => prev.map(updater));
                                                            setMyGrievances(prev => prev.map(updater));
                                                            setSelectedTicket(null); // close inspection
                                                        } else {
                                                            alert(data.error || 'Complete operation failed.');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Network error while completing job.');
                                                    }
                                                }}
                                            >
                                                Mark Work as Done
                                            </button>
                                        </div>
                                    )}

                                {selectedTicket.media_attachments && (
                                    <div className="inspection-data-segment" style={{ marginTop: '14px' }}>
                                        <h4>Before Photo (Initial Evidence)</h4>
                                        <div className="inspection-expanded-gallery">
                                            {selectedTicket.media_attachments.split(',').map((url, idx) => (
                                                <div key={idx} className="inspection-media-vault-frame">
                                                    {url.match(/\.(mp4|mov|webm)$/i) || url.includes('/video/upload/') ? (
                                                        <video src={url} controls className="vault-full-asset" />
                                                    ) : (
                                                        <img
                                                            src={url}
                                                            alt="Before Evidence"
                                                            className="vault-full-asset"
                                                            onClick={() => window.open(url, '_blank')}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTicket.after_media_attachments && (
                                    <div className="inspection-data-segment" style={{ marginTop: '14px' }}>
                                        <h4>After Photo (Verified Resolution)</h4>
                                        <div className="inspection-expanded-gallery">
                                            <div className="inspection-media-vault-frame">
                                                <img
                                                    src={selectedTicket.after_media_attachments}
                                                    alt="After Evidence"
                                                    className="vault-full-asset"
                                                    onClick={() => window.open(selectedTicket.after_media_attachments, '_blank')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Official & Contractor Department Remarks */}
                                <div className="inspection-data-segment" style={{ marginTop: '16px', borderTop: '1px solid var(--divider)', paddingTop: '16px' }}>
                                    <h4>Official & Contractor Updates & Remarks</h4>
                                    <div className="dept-comment-thread" style={{ marginBottom: '12px' }}>
                                        {ticketComments.length === 0 ? (
                                            <p className="comments-empty-state">No official updates posted yet.</p>
                                        ) : (
                                            ticketComments.map((c) => (
                                                <div key={c.id} className="dept-comment-bubble">
                                                    <div className="dept-comment-meta">
                                                        <span className="dept-comment-author">{c.author_name}</span>
                                                        <span className="dept-comment-dept-tag">({c.department})</span>
                                                        <span className="dept-comment-time">
                                                            {new Date(c.created_at).toLocaleString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="dept-comment-text">{c.comment_text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Department & Assigned Contractor comment form */}
                                    {((userProfile.role !== 'citizen' && userProfile.role !== 'super_admin') || (selectedTicket.assigned_contractor && userProfile.email && selectedTicket.assigned_contractor.toLowerCase().trim() === userProfile.email.toLowerCase().trim())) && (
                                        <div className="dept-comment-form">
                                            <textarea
                                                placeholder="Add an official department or contractor update (e.g., 'Work order issued. Site inspection in progress.')"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="dept-post-comment-btn"
                                                onClick={handlePostComment}
                                                disabled={postingComment || !newComment.trim()}
                                            >
                                                {postingComment ? 'Posting...' : 'Post Update'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Official Department Resolution with Photo Upload */}
                                {(userProfile.role !== 'citizen' && userProfile.role !== 'super_admin' && !(userProfile.role && userProfile.role.toLowerCase().includes('contractor'))) &&
                                    (String(selectedTicket.status || '').toLowerCase() === 'pending' || String(selectedTicket.status || '').toLowerCase() === 'pending verification') && (
                                        <div className="inspection-data-segment simulator-box" style={{ borderStyle: 'solid' }}>
                                            <h4>Department Resolution Action</h4>
                                            <p>
                                                Upload a proof photo of the completed work to mark this grievance as officially Resolved.
                                            </p>
                                            <label className="simulator-trigger-btn" style={{ display: 'inline-block', textAlign: 'center', cursor: 'pointer' }}>
                                                Upload Photo & Mark Job Completed
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async (e) => {
                                                        if (!e.target.files || !e.target.files.length) return;
                                                        const file = e.target.files[0];
                                                        const formData = new FormData();
                                                        formData.append('afterMedia', file);

                                                        try {
                                                            const res = await fetch(`${API_BASE_URL}/api/grievances/${selectedTicket.complaint_no}/resolve-status`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                                },
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                alert('Job successfully marked as Resolved with proof of completion photo!');
                                                                const updater = item => item.complaint_no === selectedTicket.complaint_no ? { ...item, status: 'Resolved', after_media_attachments: data.afterPhoto } : item;
                                                                setAllGrievances(prev => prev.map(updater));
                                                                setMyGrievances(prev => prev.map(updater));
                                                                setSelectedTicket(null); // close inspection
                                                            } else {
                                                                alert(data.error || 'Resolution failed.');
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Network error while marking job as resolved.');
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}
                            </div>

                            <div className="inspection-modal-footer">
                                <span className="footer-timestamp-log">
                                    Logged: {new Date(selectedTicket.created_at).toLocaleString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <button className="inspection-dismiss-btn" onClick={() => setSelectedTicket(null)}>
                                    Close Inspector
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile-details' && (
                    <div className="dashboard-placeholder-card">
                        <h2>Citizen Information Identity File</h2>
                        <p>Manage legal contact numbers, authorization profile hashes, and submitted telemetry logs securely inside your SQL Server grid.</p>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="dashboard-placeholder-card">
                        <h2>Portal System Settings</h2>
                        <p>Configure interface access profiles, notifications routing layers, and local system theme configurations.</p>
                    </div>
                )}

                {/* ============================================================ */}
                {/* SUPER ADMIN PANEL — only visible to role === 'super_admin'   */}
                {/* ============================================================ */}
                {activeTab === 'admin-panel' && userProfile.role === 'super_admin' && (
                    <div className="admin-panel-container">
                        <div className="admin-panel-header" style={{ marginBottom: '16px' }}>
                            <div className="admin-panel-title-row">
                                <span className="admin-shield-icon">🛡️</span>
                                <div>
                                    <h2>Super Admin Control & Analytics Suite</h2>
                                    <p>Manage official whitelists, inspect individual worker performance, and analyze ward-wise category statistics across Mangaluru.</p>
                                </div>
                            </div>
                        </div>

                        {/* Super Admin Sub-Navigation Tabs */}
                        <div className="admin-panel-sub-nav" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    background: adminSubTab === 'whitelist' ? 'var(--brand-primary)' : 'var(--card-bg)',
                                    color: adminSubTab === 'whitelist' ? '#fff' : 'var(--text-main)',
                                    boxShadow: adminSubTab === 'whitelist' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                                }}
                                onClick={() => setAdminSubTab('whitelist')}
                            >
                                Officials Whitelist & Invites
                            </button>

                            <button
                                type="button"
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    background: adminSubTab === 'official-stats' ? 'var(--brand-primary)' : 'var(--card-bg)',
                                    color: adminSubTab === 'official-stats' ? '#fff' : 'var(--text-main)',
                                    boxShadow: adminSubTab === 'official-stats' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                                }}
                                onClick={() => setAdminSubTab('official-stats')}
                            >
                                Official & Contractor Work Stats
                            </button>

                            <button
                                type="button"
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    background: adminSubTab === 'ward-stats' ? 'var(--brand-primary)' : 'var(--card-bg)',
                                    color: adminSubTab === 'ward-stats' ? '#fff' : 'var(--text-main)',
                                    boxShadow: adminSubTab === 'ward-stats' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                                }}
                                onClick={() => setAdminSubTab('ward-stats')}
                            >
                                Ward Category Analytics
                            </button>
                        </div>

                        {/* SUB-TAB 1: Whitelist & Invite Official Form */}
                        {adminSubTab === 'whitelist' && (
                            <>
                                <div className="admin-invite-card">
                                    <h3 className="admin-card-title">Add Approved Official / Contractor</h3>
                                    <form className="admin-invite-form" onSubmit={handleInviteOfficial}>
                                        <div className="admin-form-row">
                                            <div className="admin-form-group">
                                                <label htmlFor="invite-email">Official's Email Address</label>
                                                <input
                                                    id="invite-email"
                                                    type="email"
                                                    placeholder="e.g. santhosh.pwd@gmail.com"
                                                    value={inviteForm.email}
                                                    onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                                    required
                                                    className="admin-input"
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label htmlFor="invite-dept">Department Assignment</label>
                                                <select
                                                    id="invite-dept"
                                                    value={inviteForm.department}
                                                    onChange={handleDepartmentChange}
                                                    className="admin-select"
                                                >
                                                    <option value="MCC">MCC</option>
                                                    <option value="Water Supply & Sewage Board">Water Supply &amp; Sewage Board</option>
                                                    <option value="MESCOM">MESCOM</option>
                                                    <option value="Stray / Animal Welfare & Health Dept">Stray / Animal Welfare &amp; Health Dept</option>
                                                    <option value="City Council (Ward Corporators)">City Council (Ward Corporators)</option>
                                                </select>
                                            </div>
                                            <div className="admin-form-group">
                                                <label htmlFor="invite-ward">Ward Assignment</label>
                                                <select
                                                    id="invite-ward"
                                                    value={inviteForm.wardAssignment}
                                                    onChange={e => setInviteForm(prev => ({ ...prev, wardAssignment: e.target.value }))}
                                                    className="admin-select"
                                                >
                                                    <option value="All Wards">All Wards (City-wide)</option>
                                                    {MANGALORE_60_WARDS_LIST.map(w => (
                                                        <option key={w} value={w}>{w}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="admin-form-group">
                                                <label htmlFor="invite-role">Assign Role</label>
                                                <select
                                                    id="invite-role"
                                                    value={inviteForm.role}
                                                    onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                                                    className="admin-select"
                                                >
                                                    {(DEPARTMENT_ROLES[inviteForm.department] || []).map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {inviteStatus.message && (
                                            <div className={`admin-status-banner ${inviteStatus.type === 'success' ? 'admin-status-success' : 'admin-status-error'}`}>
                                                {inviteStatus.message}
                                            </div>
                                        )}

                                        <button type="submit" className="admin-invite-btn" disabled={inviteLoading}>
                                            {inviteLoading ? 'Sending Invite...' : '+ Invite Official'}
                                        </button>
                                    </form>
                                </div>

                                <div className="admin-officials-card">
                                    <div className="admin-officials-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <h3 className="admin-card-title" style={{ margin: 0 }}>
                                            Approved Officials Whitelist <span style={{ fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.8, marginLeft: '8px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--card-border)' }}>{officials.length} Registered</span>
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="Search ward, email, role..."
                                                value={officialsSearch}
                                                onChange={e => setOfficialsSearch(e.target.value)}
                                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                                            />
                                            <select
                                                value={officialsDeptFilter}
                                                onChange={e => setOfficialsDeptFilter(e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--card-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                                            >
                                                <option value="ALL">All Departments</option>
                                                <option value="City Council (Ward Corporators)">Corporators</option>
                                                <option value="MCC">MCC</option>
                                                <option value="MESCOM">MESCOM</option>
                                                <option value="Water Supply & Sewage Board">Water Board</option>
                                                <option value="Stray / Animal Welfare & Health Dept">Health / Animals</option>
                                            </select>
                                            <button className="admin-refresh-btn" onClick={fetchOfficials} disabled={loadingOfficials}>
                                                {loadingOfficials ? 'Loading...' : '↻ Refresh'}
                                            </button>
                                        </div>
                                    </div>

                                    {loadingOfficials ? (
                                        <div className="admin-loading-state">Synchronizing whitelist records...</div>
                                    ) : officials.length === 0 ? (
                                        <div className="admin-empty-state">
                                            <p>No officials have been invited yet.</p>
                                            <p>Use the form above to whitelist an engineer or department worker.</p>
                                        </div>
                                    ) : (
                                        <div className="admin-officials-table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            <table className="admin-officials-table">
                                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)', zIndex: 2 }}>
                                                    <tr>
                                                        <th>Email</th>
                                                        <th>Role</th>
                                                        <th>Department</th>
                                                        <th>Ward Assignment</th>
                                                        <th>Invited On</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {officials
                                                        .filter(official => {
                                                            const matchesDept = officialsDeptFilter === 'ALL' || official.department === officialsDeptFilter;
                                                            if (!matchesDept) return false;
                                                            if (!officialsSearch || !officialsSearch.trim()) return true;

                                                            const q = officialsSearch.trim().toLowerCase();
                                                            const literalText = `${official.email} ${official.role} ${official.department} ${official.ward_assignment}`.toLowerCase();
                                                            if (literalText.includes(q)) return true;

                                                            const officialWardMatch = String(official.ward_assignment || '').match(/Ward\s+(\d+)/i);
                                                            const officialWardNum = officialWardMatch ? parseInt(officialWardMatch[1], 10) : null;

                                                            if (officialWardNum !== null) {
                                                                const queryNumMatch = q.match(/(?:ward\s*)?(\d+)/i);
                                                                if (queryNumMatch && parseInt(queryNumMatch[1], 10) === officialWardNum) {
                                                                    return true;
                                                                }

                                                                const aliases = MANGALORE_WARD_ALIASES[officialWardNum] || [];
                                                                if (aliases.some(alias => alias.includes(q) || q.includes(alias))) {
                                                                    return true;
                                                                }
                                                            }

                                                            return false;
                                                        })
                                                        .map(official => (
                                                            <tr key={official.id} className="admin-official-row">
                                                                <td className="admin-td-email">{official.email}</td>
                                                                <td>
                                                                    <span className="admin-role-badge">
                                                                        👤 {official.role}
                                                                    </span>
                                                                </td>
                                                                <td className="admin-td-dept">{official.department || '—'}</td>
                                                                <td className="admin-td-dept" style={{ whiteSpace: 'nowrap' }}>{official.ward_assignment || 'All Wards'}</td>
                                                                <td className="admin-td-date">
                                                                    {new Date(official.invited_at).toLocaleDateString('en-IN', {
                                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                                    })}
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="admin-revoke-btn"
                                                                        onClick={() => handleRevokeOfficial(official.email)}
                                                                    >
                                                                        Revoke
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* SUB-TAB 2: Official & Contractor Work Performance Statistics */}
                        {adminSubTab === 'official-stats' && (() => {
                            const selectedOfficial = officials.find(o => o.email === selectedOfficialEmail) || (selectedOfficialEmail ? { email: selectedOfficialEmail, role: 'Official / Contractor', department: 'Assigned', ward_assignment: 'All Wards' } : null);

                            let officialTickets = [];
                            if (selectedOfficialEmail) {
                                const lowerEmail = selectedOfficialEmail.toLowerCase().trim();
                                officialTickets = allGrievances.filter(t => {
                                    if (t.assigned_contractor && t.assigned_contractor.toLowerCase().trim() === lowerEmail) return true;
                                    if (selectedOfficial && selectedOfficial.ward_assignment && selectedOfficial.ward_assignment !== 'All Wards') {
                                        const officialWardNum = extractWardNumber(selectedOfficial.ward_assignment);
                                        const ticketWardNum = extractWardNumber(t.ward_number);
                                        if (officialWardNum && ticketWardNum && officialWardNum === ticketWardNum) {
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                            }

                            const totalJobs = officialTickets.length;
                            const resolvedJobs = officialTickets.filter(t => String(t.status || '').toLowerCase() === 'resolved').length;
                            const pendingVerifJobs = officialTickets.filter(t => String(t.status || '').toLowerCase() === 'pending verification').length;
                            const activeJobs = officialTickets.filter(t => String(t.status || '').toLowerCase() === 'pending' || String(t.status || '').toLowerCase() === 'in progress').length;
                            const completionRate = totalJobs > 0 ? ((resolvedJobs / totalJobs) * 100).toFixed(1) : '0.0';

                            return (
                                <div className="official-performance-analytics-container">
                                    <div className="admin-invite-card" style={{ marginBottom: '20px' }}>
                                        <h3 className="admin-card-title">Select Official / Contractor to Inspect Work Statistics</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                                            Choose any registered official or contractor to view their total assigned jobs, completion count, and detailed work ledger.
                                        </p>

                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select
                                                value={selectedOfficialEmail}
                                                onChange={(e) => setSelectedOfficialEmail(e.target.value)}
                                                className="admin-select"
                                                style={{ flex: 1, minWidth: '280px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                                            >
                                                <option value="">-- Select Official or Contractor Email --</option>
                                                <optgroup label="Whitelisted Officials & Contractors">
                                                    {officials.map(o => (
                                                        <option key={o.id || o.email} value={o.email}>
                                                            {o.email} ({o.role} — {o.department || 'All Departments'})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>

                                    {selectedOfficialEmail ? (
                                        <div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                                <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Jobs / Grievances</span>
                                                    <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: 'var(--brand-primary)' }}>{totalJobs}</h2>
                                                </div>
                                                <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Completed & Resolved</span>
                                                    <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: '#16a34a' }}>{resolvedJobs}</h2>
                                                </div>
                                                <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Pending Verification</span>
                                                    <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: '#eab308' }}>{pendingVerifJobs}</h2>
                                                </div>
                                                <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active / In Progress</span>
                                                    <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: '#ef4444' }}>{activeJobs}</h2>
                                                </div>
                                            </div>

                                            <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Work Resolution Efficiency</span>
                                                    <span style={{ fontWeight: '800', fontSize: '1rem', color: '#16a34a' }}>{completionRate}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                                                </div>
                                            </div>

                                            <div className="admin-officials-card">
                                                <h3 className="admin-card-title">Assigned Grievance Work History for {selectedOfficialEmail}</h3>
                                                {officialTickets.length === 0 ? (
                                                    <div className="admin-empty-state">No grievances currently logged under this official's jurisdiction or assignment.</div>
                                                ) : (
                                                    <div className="admin-officials-table-wrap">
                                                        <table className="admin-officials-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Ticket ID</th>
                                                                    <th>Ward</th>
                                                                    <th>Department & Issue Category</th>
                                                                    <th>Status</th>
                                                                    <th>Severity</th>
                                                                    <th>Date Logged</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {officialTickets.map(t => (
                                                                    <tr key={t.complaint_no}>
                                                                        <td><strong>#CS-{t.complaint_no}</strong></td>
                                                                        <td>{t.ward_number}</td>
                                                                        <td>{t.department} {t.category ? `(${t.category})` : ''}</td>
                                                                        <td>
                                                                            <span className={`status-pill-token status-${String(t.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                                                                {t.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>{t.severity ? t.severity.split(' ')[0] : 'Low'}</td>
                                                                        <td>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                                                                        <td>
                                                                            <button
                                                                                style={{ padding: '4px 10px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}
                                                                                onClick={() => setSelectedTicket(t)}
                                                                            >
                                                                                Inspect Ticket
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="admin-officials-card" style={{ padding: '40px', textAlign: 'center' }}>
                                            <p>Select an official or contractor from the dropdown above to view their job statistics.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* SUB-TAB 3: Ward-wise Category Statistical Visualization */}
                        {adminSubTab === 'ward-stats' && (() => {
                            const filteredWardTickets = allGrievances.filter(t => {
                                if (selectedAnalyticsWard === 'ALL') return true;
                                const selWardNum = extractWardNumber(selectedAnalyticsWard);
                                const ticketWardNum = extractWardNumber(t.ward_number);
                                if (selWardNum && ticketWardNum) return selWardNum === ticketWardNum;
                                return t.ward_number === selectedAnalyticsWard;
                            });

                            const categoryCounts = {};
                            const categoryStatusCounts = {};
                            filteredWardTickets.forEach(t => {
                                let cat = t.category || 'Potholes and Road Damage';
                                if (!cat || cat === 'General') {
                                    cat = t.department ? `General (${t.department})` : 'Other Civic Issue';
                                }
                                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                                if (!categoryStatusCounts[cat]) {
                                    categoryStatusCounts[cat] = { resolved: 0, active: 0 };
                                }
                                if (String(t.status || '').toLowerCase() === 'resolved') {
                                    categoryStatusCounts[cat].resolved += 1;
                                } else {
                                    categoryStatusCounts[cat].active += 1;
                                }
                            });

                            const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

                            const totalWardTickets = filteredWardTickets.length;
                            const totalResolved = filteredWardTickets.filter(t => String(t.status || '').toLowerCase() === 'resolved').length;
                            const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : 'None';
                            const wardResolutionRate = totalWardTickets > 0 ? ((totalResolved / totalWardTickets) * 100).toFixed(1) : '0.0';

                            return (
                                <div className="ward-category-analytics-container">
                                    <div className="admin-invite-card" style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                                            <div>
                                                <h3 className="admin-card-title" style={{ margin: 0 }}>Ward-wise Category Statistical Visualization</h3>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Inspect category distribution, issue hotspots, and resolution efficiency across all 60 municipal wards of Mangaluru.
                                                </p>
                                            </div>

                                            <div style={{ minWidth: '260px' }}>
                                                <select
                                                    value={selectedAnalyticsWard}
                                                    onChange={(e) => setSelectedAnalyticsWard(e.target.value)}
                                                    className="admin-select"
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontWeight: '700' }}
                                                >
                                                    <option value="ALL">ALL WARDS (City-wide Overview)</option>
                                                    {MANGALORE_60_WARDS_LIST.map(w => (
                                                        <option key={w} value={w}>{w}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                        <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Ward Complaints</span>
                                            <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: 'var(--brand-primary)' }}>{totalWardTickets}</h2>
                                        </div>
                                        <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Resolved Issues</span>
                                            <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: '#16a34a' }}>{totalResolved}</h2>
                                        </div>
                                        <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Resolution Efficiency</span>
                                            <h2 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', color: '#22c55e' }}>{wardResolutionRate}%</h2>
                                        </div>
                                        <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Top Problem Category</span>
                                            <h4 style={{ margin: '6px 0 0 0', fontSize: '0.95rem', color: '#ea580c', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={topCategory}>{topCategory}</h4>
                                        </div>
                                    </div>

                                    <div className="admin-officials-card" style={{ marginBottom: '20px' }}>
                                        <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>Category Breakdown Visualization ({selectedAnalyticsWard === 'ALL' ? 'City-wide' : selectedAnalyticsWard})</h3>

                                        {sortedCategories.length === 0 ? (
                                            <div className="admin-empty-state">No complaints registered in this ward yet.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                {sortedCategories.map(cat => {
                                                    const count = categoryCounts[cat];
                                                    const pct = totalWardTickets > 0 ? Math.round((count / totalWardTickets) * 100) : 0;
                                                    const statusData = categoryStatusCounts[cat] || { resolved: 0, active: 0 };
                                                    return (
                                                        <div key={cat} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                                                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                                    {cat}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                                    <span style={{ color: '#16a34a' }}>{statusData.resolved} Resolved</span>
                                                                    <span style={{ color: '#ef4444' }}>{statusData.active} Active</span>
                                                                    <span style={{ background: 'var(--brand-primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>{count} Total ({pct}%)</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-primary), #a855f7)', borderRadius: '5px', transition: 'width 0.4s ease' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;