import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Handshake, Info, Lock, Trophy, Users } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  cancelRegistration,
  fetchHackathonDetail,
  fetchHackathonLeaderboard,
  fetchHackathonTeams,
  fetchRegistrationStatus,
  registerHackathon,
  submitResult,
} from "../api/hackathons.js";
import {
  applyToTeam,
  createTeam,
  decideTeamApplication,
  deleteTeam,
  fetchMyTeams,
  fetchTeamApplications,
  fetchTeamDetail,
  updateTeam,
} from "../api/teams.js";
import { getStoredUser } from "../lib/auth.js";
import { joinChat } from "../api/chat.js";
import { openChatDrawer } from "../lib/chat-events.js";

const detailTabs = [
  { key: "overview", label: "개요" },
  { key: "schedule", label: "일정" },
  { key: "prize", label: "상금" },
  { key: "team", label: "팀" },
  { key: "submit", label: "제출" },
  { key: "leaderboard", label: "리더보드" },
];

function createEmptyPosition() {
  return {
    positionName: "",
    requiredCount: "1",
  };
}

function getSubmitState(isRegistered, hasTeam, hackathonStatus) {
  if (!isRegistered) return "notRegistered";
  if (!hasTeam) return "noTeam";
  return hackathonStatus === "closed" || hackathonStatus === "ended" ? "closed" : "open";
}

function HackathonDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    detailTabs.some((tab) => tab.key === requestedTab) ? requestedTab : "overview",
  );
  const [teamState, setTeamState] = useState("A");
  const [submitState, setSubmitState] = useState("notRegistered");
  const [isParticipationModeOpen, setIsParticipationModeOpen] = useState(false);
  const [isTeamNoticeOpen, setIsTeamNoticeOpen] = useState(false);
  const [teamNoticeMode, setTeamNoticeMode] = useState(null);
  const [isExistingTeamSelectOpen, setIsExistingTeamSelectOpen] = useState(false);
  const [remoteHackathon, setRemoteHackathon] = useState(null);
  const [remoteTeams, setRemoteTeams] = useState(null);
  const [remoteLeaderboard, setRemoteLeaderboard] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [myTeams, setMyTeams] = useState([]);
  const [myTeamDetail, setMyTeamDetail] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [chatJoined, setChatJoined] = useState(false)
  const [chatJoining, setChatJoining] = useState(false)
  const [chatJoinMessage, setChatJoinMessage] = useState('')
  const [teamEditForm, setTeamEditForm] = useState({
    name: "",
    description: "",
    isOpen: true,
    maxMembers: "5",
    positions: [createEmptyPosition()],
  });
  const [teamEditMessage, setTeamEditMessage] = useState("");
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [submitMemo, setSubmitMemo] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetailMessage, setTeamDetailMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [appliedTeamIds, setAppliedTeamIds] = useState([]);
  const [selectedExistingTeamId, setSelectedExistingTeamId] = useState("");
  const [existingTeamMessage, setExistingTeamMessage] = useState("");
  const [isRegisteringExistingTeam, setIsRegisteringExistingTeam] = useState(false);
  const [isTeamCreateModalOpen, setIsTeamCreateModalOpen] = useState(false);
  const [teamCreateForm, setTeamCreateForm] = useState({
    name: "",
    description: "",
    maxMemberCount: "4",
    positions: [{ positionName: "", requiredCount: "1" }],
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamCreateError, setTeamCreateError] = useState(null);
  const [leaveTeamConfirmOpen, setLeaveTeamConfirmOpen] = useState(false);
  const [deleteTeamConfirmOpen, setDeleteTeamConfirmOpen] = useState(false);
  const [registerHereLoading, setRegisterHereLoading] = useState(false);
  const [selectedTeamForRegistration, setSelectedTeamForRegistration] = useState("");
  const [registerConfirmOpen, setRegisterConfirmOpen] = useState(false);
  const [teamCreateAutoRegister, setTeamCreateAutoRegister] = useState(false);
  const [c2View, setC2View] = useState("choice"); // "choice" | "select"
  const currentUser = getStoredUser();
  const currentUserId = currentUser?.userId ?? null;
  const currentUserNickname = currentUser?.nickname ?? null;

  useEffect(() => {
    const nextTab = detailTabs.some((tab) => tab.key === requestedTab) ? requestedTab : "overview";
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, requestedTab]);

  const changeActiveTab = (tabKey) => {
    setActiveTab(tabKey);
    const nextParams = new URLSearchParams(searchParams);
    if (tabKey === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tabKey);
    }
    setSearchParams(nextParams, { replace: true });
  };

  async function handleOpenTeam(teamId) {
    setSelectedPosition("");
    setTeamDetailMessage(currentUser ? "" : "로그인 후 합류 신청이 가능합니다.");
    try {
      const detail = await fetchTeamDetail(teamId);
      setSelectedTeam(detail);
    } catch {
      const fallback = participantTeams.find((t) => t.id === teamId) ?? null;
      setSelectedTeam({ ...fallback, members: [] });
      setTeamDetailMessage("팀 상세 정보를 불러오지 못해 기본 정보만 표시합니다.");
    }
  }

  async function handleApply() {
    if (!currentUser) { navigate("/login"); return; }
    setIsApplying(true);
    setTeamDetailMessage("");
    try {
      await applyToTeam(selectedTeam.id, selectedPosition || null);
      setAppliedTeamIds((prev) => prev.includes(selectedTeam.id) ? prev : [...prev, selectedTeam.id]);
      setTeamDetailMessage("합류 신청이 완료되었습니다.");
    } catch {
      setTeamDetailMessage("합류 신청에 실패했습니다. 이미 신청했거나 팀 정원이 찼을 수 있습니다.");
    } finally {
      setIsApplying(false);
    }
  }

  const openParticipationEntry = () => {
    if (!currentUser) {
      setRegistrationMessage("로그인 후 팀 생성과 해커톤 참가가 가능합니다.");
      navigate("/login");
      return;
    }

    setRegistrationMessage("");
    setIsParticipationModeOpen(true);
  };

  const openParticipationNotice = (mode) => {
    setIsParticipationModeOpen(false);
    setTeamNoticeMode(mode);
    setIsTeamNoticeOpen(true);
  };

  function openTeamCreateModal(autoRegister = false) {
    if (!currentUser) { navigate("/login"); return; }
    setTeamCreateForm({ name: "", description: "", maxMemberCount: "4", positions: [{ positionName: "", requiredCount: "1" }] });
    setTeamCreateError(null);
    setTeamCreateAutoRegister(autoRegister);
    setIsTeamCreateModalOpen(true);
  }

  async function handleTeamCreate() {
    setIsCreatingTeam(true);
    setTeamCreateError(null);
    try {
      const newTeam = await createTeam({
        name: teamCreateForm.name.trim(),
        description: teamCreateForm.description.trim() || null,
        isOpen: true,
        maxMemberCount: Number(teamCreateForm.maxMemberCount) || 4,
        hackathonId: Number(id),
        positions: teamCreateForm.positions
          .map((p) => ({ positionName: p.positionName.trim(), requiredCount: Number(p.requiredCount) || 1 }))
          .filter((p) => p.positionName),
      });
      setIsTeamCreateModalOpen(false);

      if (teamCreateAutoRegister && newTeam?.id) {
        // A / B / C-1: 생성 후 바로 이 해커톤으로 신청
        await registerHackathon(id, newTeam.id);
        await completeRegistration(newTeam.id, "팀을 생성하고 해커톤에 참가 신청했습니다.");
      } else {
        // C-2: 팀 목록 갱신 후 새 팀 선택 상태로
        const freshMyTeams = await fetchMyTeams(id);
        setMyTeams(freshMyTeams);
        if (newTeam?.id) {
          setSelectedTeamForRegistration(String(newTeam.id));
        }
      }
    } catch {
      setTeamCreateError("팀 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function handleRegisterHere() {
    if (!selectedTeamForRegistration) return;
    setRegisterHereLoading(true);
    setRegistrationMessage("");
    setRegisterConfirmOpen(false);
    try {
      await registerHackathon(id, Number(selectedTeamForRegistration));
      await completeRegistration(Number(selectedTeamForRegistration), "이 해커톤에 참가 신청이 완료되었습니다.");
    } catch {
      setRegistrationMessage("참가 신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setRegisterHereLoading(false);
    }
  }

  function resolveTeamStateFromList(freshMyTeams) {
    const eligibleTeams = freshMyTeams.filter(
      t => !t.hackathonId || String(t.hackathonId) === String(id)
    );
    if (eligibleTeams.length === 0) return "B";
    const leaderTeam = eligibleTeams.find(
      t => String(t.leaderId) === String(currentUser?.userId) || t.leader === currentUser?.nickname
    );
    if (leaderTeam) setSelectedTeamForRegistration(String(leaderTeam.id));
    return leaderTeam ? "C2" : "C1";
  }

  async function handleLeaveTeam() {
    try {
      await cancelRegistration(id);
      setRegistrationStatus(null);
      setMyTeamDetail(null);
      setApplications([]);
      const freshMyTeams = await fetchMyTeams(id);
      setMyTeams(freshMyTeams);
      const nextState = freshMyTeams.length === 0 ? "A" : resolveTeamStateFromList(freshMyTeams);
      setTeamState(nextState);
      setSubmitState(getSubmitState(false, false, hackathon?.status));
      setRegistrationMessage("참가가 취소되었습니다.");
      setLeaveTeamConfirmOpen(false);
      await refreshParticipantTeams();
    } catch {
      setRegistrationMessage("참가 취소에 실패했습니다.");
      setLeaveTeamConfirmOpen(false);
    }
  }

  async function handleDeleteTeam() {
    if (!myTeamDetail?.id) return;
    try {
      setIsDeletingTeam(true);
      await deleteTeam(myTeamDetail.id);
      const freshMyTeams = await fetchMyTeams(id);
      setMyTeams(freshMyTeams);
      setMyTeamDetail(null);
      setApplications([]);
      setRegistrationStatus(null);
      const nextState = freshMyTeams.length === 0 ? "A" : resolveTeamStateFromList(freshMyTeams);
      setTeamState(nextState);
      setSubmitState(getSubmitState(false, false, hackathon?.status));
      await refreshParticipantTeams();
      setRegistrationMessage("팀이 삭제되었습니다.");
      setDeleteTeamConfirmOpen(false);
    } catch {
      setRegistrationMessage("팀 삭제에 실패했습니다.");
      setDeleteTeamConfirmOpen(false);
    } finally {
      setIsDeletingTeam(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      let hackathonDetail = null;
      try {
        const [detail, participantTeams, leaderboard] = await Promise.all([
          fetchHackathonDetail(id),
          fetchHackathonTeams(id),
          fetchHackathonLeaderboard(id),
        ]);
        hackathonDetail = detail;

        if (!isMounted) return;

        setRemoteHackathon(detail);
        setRemoteTeams(participantTeams);
        setRemoteLeaderboard(leaderboard);
      } catch {
        if (!isMounted) return;

        setRemoteHackathon(null);
        setRemoteTeams(null);
        setRemoteLeaderboard(null);
      }

      if (getStoredUser()) {
        try {
          const [statusResult, myTeamsResult] = await Promise.allSettled([
            fetchRegistrationStatus(id),
            fetchMyTeams(id),
          ]);

          if (!isMounted) return;

          const status = statusResult.status === "fulfilled" ? statusResult.value : null;
          const myTeams = myTeamsResult.status === "fulfilled" ? myTeamsResult.value : [];

          setRegistrationStatus(status);
          setMyTeams(myTeams);

          const registeredTeamId = status?.teamId ?? null;
          const isRegisteredHere = Boolean(registeredTeamId);
          const hasTeam = myTeams.length > 0;

          let newTeamState = "A";

          if (!hasTeam) {
            newTeamState = "A";
            setSubmitState(getSubmitState(false, false, hackathonDetail?.status));
          } else if (isRegisteredHere) {
            const registeredTeam = myTeams.find(t => String(t.id) === String(registeredTeamId));
            const isLeaderOfRegistered =
              registeredTeam &&
              (String(registeredTeam.leaderId) === String(currentUserId) ||
                registeredTeam.leader === currentUserNickname);
            newTeamState = isLeaderOfRegistered ? "D2" : "D1";
            setSubmitState(getSubmitState(true, true, hackathonDetail?.status));
          } else {
            // eligible = not assigned to any hackathon, or assigned to this one
            const eligibleTeams = myTeams.filter(
              t => !t.hackathonId || String(t.hackathonId) === String(id)
            );
            if (eligibleTeams.length === 0) {
              newTeamState = "B";
            } else {
              const firstLeaderTeam = eligibleTeams.find(
                t => String(t.leaderId) === String(currentUserId) ||
                     t.leader === currentUserNickname
              );
              newTeamState = firstLeaderTeam ? "C2" : "C1";
              if (firstLeaderTeam && isMounted) {
                setSelectedTeamForRegistration(String(firstLeaderTeam.id));
              }
            }
            setSubmitState(getSubmitState(false, false, hackathonDetail?.status));
          }

          if (isMounted) {
            setTeamState(newTeamState);
            if (newTeamState === "C2") setC2View("choice");
          }

          // D 상태: myTeams에 없는 경우(팀원으로 가입한 팀)도 registeredTeamId로 직접 조회
          const teamIdForDetail = isRegisteredHere ? (
            myTeams.find(team => String(team.id) === String(registeredTeamId))?.id ?? registeredTeamId
          ) : null;

          if (teamIdForDetail) {
            try {
              const isLeaderState = newTeamState === "D2";
              const [detail, applicationRows] = await Promise.all([
                fetchTeamDetail(teamIdForDetail),
                isLeaderState ? fetchTeamApplications(teamIdForDetail) : Promise.resolve([]),
              ]);

              if (!isMounted) return;
              setMyTeamDetail(detail);
              setApplications(applicationRows);
            } catch {
              if (!isMounted) return;
              const fallback = myTeams.find(t => String(t.id) === String(registeredTeamId));
              if (fallback) setMyTeamDetail(fallback);
              setApplications([]);
            }

            setRemoteTeams((current) => {
              const others = (current ?? []).filter(
                (team) => String(team.id) !== String(teamIdForDetail),
              );
              const matched = myTeams.find(t => String(t.id) === String(teamIdForDetail));
              return matched ? [matched, ...others] : others;
            });
          }
        } catch {
          if (!isMounted) return;
          setRegistrationStatus(null);
          setMyTeams([]);
          setTeamState("A");
          setSubmitState(getSubmitState(false, false, hackathonDetail?.status));
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id, currentUserId, currentUserNickname]);

  const hackathon = useMemo(() => {
    if (!remoteHackathon) return null;

    return {
      ...remoteHackathon,
      schedules: remoteHackathon.schedules ?? [],
      evaluations: remoteHackathon.evaluations ?? [],
      prizes: remoteHackathon.prizes ?? [],
      teamStates: remoteHackathon.teamStates ?? {},
      submitStates: remoteHackathon.submitStates ?? {},
      leaderboard: remoteLeaderboard ?? { scoreType: "SCORE", items: [] },
    };
  }, [remoteHackathon, remoteLeaderboard]);

  const participantTeams = remoteTeams ?? [];
  const eligibleMyTeams = myTeams.filter(
    (team) => !team.hackathonId || String(team.hackathonId) === String(id),
  );

  const currentLeaderId = myTeamDetail?.leaderId ?? null;

  useEffect(() => {
    if (!myTeamDetail) return;

    setTeamEditForm({
      name: myTeamDetail.name ?? "",
      description: myTeamDetail.description ?? "",
      isOpen: myTeamDetail.isOpen ?? true,
      maxMembers: String(myTeamDetail.maxMembers ?? 5),
      positions:
        myTeamDetail.positionDetails?.length > 0
          ? myTeamDetail.positionDetails.map((position) => ({
              positionName: position.positionName,
              requiredCount: String(position.requiredCount ?? 1),
            }))
          : [createEmptyPosition()],
    });
  }, [myTeamDetail]);

  const refreshParticipantTeams = async () => {
    try {
      const rows = await fetchHackathonTeams(id);
      setRemoteTeams(rows);
      return rows;
    } catch {
      return null;
    }
  };

  const refreshMyTeamState = async (teamId) => {
    try {
      const [detail, applicationRows] = await Promise.all([
        fetchTeamDetail(teamId),
        fetchTeamApplications(teamId),
      ]);

      setMyTeamDetail(detail);
      setApplications(applicationRows);
      return detail;
    } catch {
      return null;
    }
  };

  const completeRegistration = async (teamId, successMessage) => {
    const hasTeam = Boolean(teamId);
    setRegistrationStatus({
      registered: true,
      teamId,
      teamName: myTeams.find((team) => String(team.id) === String(teamId))?.name ?? null,
    });
    // Registration is always performed by the team leader
    setTeamState(hasTeam ? "D2" : "A");
    setSubmitState(getSubmitState(true, hasTeam, hackathon?.status));
    setRegistrationMessage(successMessage);
    changeActiveTab("team");
    if (teamId) {
      await refreshMyTeamState(teamId);
    }
    await refreshParticipantTeams();
  };

  const handleTeamNoticeConfirm = () => {
    setIsTeamNoticeOpen(false);

    if (teamNoticeMode === "new") {
      navigate(`/camp?hackathonId=${id}`);
      return;
    }

    setExistingTeamMessage("");
    setSelectedExistingTeamId(
      eligibleMyTeams.length > 0 ? String(eligibleMyTeams[0].id) : "",
    );
    setIsExistingTeamSelectOpen(true);
  };

  const handleExistingTeamRegister = async () => {
    if (!selectedExistingTeamId) {
      setExistingTeamMessage("참가할 팀을 먼저 선택해주세요.");
      return;
    }

    setIsRegisteringExistingTeam(true);
    setExistingTeamMessage("");

    try {
      await registerHackathon(id, Number(selectedExistingTeamId));
      await completeRegistration(
        Number(selectedExistingTeamId),
        "기존 팀으로 참가가 완료되었습니다.",
      );
      setIsExistingTeamSelectOpen(false);
    } catch {
      setExistingTeamMessage("기존 팀 참가에 실패했습니다. 팀장 권한과 참가 상태를 확인해주세요.");
    } finally {
      setIsRegisteringExistingTeam(false);
    }
  };

  const scheduleSections = useMemo(() => {
    if (!hackathon) {
      return [];
    }

    if (String(id) === "1") {
      return [
        {
          title: "참가 신청",
          status: "done",
          summaryDate: "2026-03-15",
          expanded: true,
          items: [
            { date: "2026-03-15", label: "참가 신청 오픈" },
            { date: "2026-03-31", label: "참가 신청 마감" },
          ],
        },
        {
          title: "해커톤 진행",
          status: "upcoming",
          summaryDate: "2026-04-01 09:00",
          expanded: false,
          items: [
            { date: "2026-04-01 09:00", label: "오프닝 및 안내" },
            { date: "2026-04-02 18:00", label: "중간 점검" },
          ],
        },
        {
          title: "마감 및 시상",
          status: "upcoming",
          summaryDate: "2026-04-03 20:00",
          expanded: false,
          items: [
            { date: "2026-04-03 18:00", label: "최종 제출 마감" },
            { date: "2026-04-03 20:00", label: "시상 및 클로징" },
          ],
        },
      ];
    }

    return hackathon.schedules.map((schedule, index) => ({
      title: schedule.label,
      status: index === 0 ? "done" : "upcoming",
      summaryDate: schedule.at,
      expanded: index === 0,
      items: [{ date: schedule.at.split(" ")[0], label: schedule.label }],
    }));
  }, [hackathon, id]);

  if (!hackathon) {
    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">/hackathons/:id</p>
          <h1>해커톤을 찾을 수 없습니다.</h1>
          <p className="page-description">
            목록으로 돌아가서 다른 해커톤을 선택해주세요.
          </p>
        </div>
        <Link to="/hackathons" className="button-link">
          해커톤 목록으로
        </Link>
      </section>
    );
  }

  const renderTabContent = () => {
    if (activeTab === "overview") {
      async function handleChatJoin() {
        if (chatJoined) {
          openChatDrawer({ hackathonId: Number(id), refreshRooms: true })
          return
        }

        setChatJoining(true)
        setChatJoinMessage('')
        try {
          await joinChat(id)
          setChatJoined(true)
          setChatJoinMessage('채팅방에 참가했습니다.')
          openChatDrawer({ hackathonId: Number(id), refreshRooms: true })
        } catch (err) {
          if (err?.status === 409) {
            setChatJoined(true)
            setChatJoinMessage('이미 참가한 채팅방입니다.')
            openChatDrawer({ hackathonId: Number(id), refreshRooms: true })
          } else {
            setChatJoinMessage('참가에 실패했습니다.')
          }
        } finally {
          setChatJoining(false)
        }
      }

      return (
        <div className="detail-section__content">
          <section className="detail-block">
            <h2 className="detail-block__title">대회 개요</h2>
            <p className="detail-description">{hackathon.overview}</p>
          </section>

          {currentUser && (
            <section className="detail-block detail-chat-join">
              <h2 className="detail-block__title">채팅</h2>
              <p className="detail-description">해커톤 참가자들과 실시간으로 소통하세요.</p>
              <div className="detail-chat-join__row">
                <button
                  type="button"
                  className="team-primary-button"
                  disabled={chatJoining}
                  onClick={handleChatJoin}
                >
                  {chatJoining ? '참가 중...' : chatJoined ? '채팅방 입장하기' : '채팅 참가'}
                </button>
                {chatJoinMessage && (
                  <span className={`detail-chat-join__msg${chatJoined ? ' detail-chat-join__msg--ok' : ' detail-chat-join__msg--err'}`}>
                    {chatJoinMessage}
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="detail-block">
            <h2 className="detail-block__title">평가 기준</h2>
            <div className="detail-score-table">
              <div className="detail-score-row detail-score-row--head">
                <span>평가 항목</span>
                <span>비중</span>
              </div>
              {hackathon.evaluations.map((item) => (
                <div key={item.label} className="detail-score-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === "schedule") {
      return (
        <div className="detail-section__content">
          <section className="detail-block">
            <div className="row-between row-between--wrap">
              <h2 className="detail-block__title detail-block__title--plain">
                대회 일정
              </h2>
              <div className="schedule-legend">
                <span className="schedule-legend__item">
                  <span className="schedule-legend__dot schedule-legend__dot--done" />
                  완료
                </span>
                <span className="schedule-legend__item">
                  <span className="schedule-legend__dot schedule-legend__dot--progress" />
                  진행 중
                </span>
                <span className="schedule-legend__item">
                  <span className="schedule-legend__dot schedule-legend__dot--upcoming" />
                  예정
                </span>
              </div>
            </div>

            <div className="schedule-stack">
              {scheduleSections.map((section) => (
                <article key={section.title} className="schedule-card">
                  <div className="schedule-card__head">
                    <div className="schedule-card__title-wrap">
                      <span
                        className={`schedule-card__dot schedule-card__dot--${section.status}`}
                      />
                      <strong className="schedule-card__title">
                        {section.title}
                      </strong>
                    </div>
                    <div className="schedule-card__summary">
                      <span>{section.summaryDate}</span>
                      <span className="schedule-card__chevron">
                        {section.expanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {section.expanded && (
                    <div className="schedule-card__body">
                      {section.items.map((item) => (
                        <div
                          key={`${section.title}-${item.label}`}
                          className="schedule-card__item"
                        >
                          <span className="schedule-card__item-date">
                            {item.date}
                          </span>
                          <span className="schedule-card__item-label">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === "evaluation") {
      return (
        <div className="card-grid">
          {hackathon.evaluations.map((item) => (
            <div key={item.label} className="surface-card surface-card--soft">
              <p className="meta-text">{item.label}</p>
              <h2>{item.value}</h2>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "prize") {
      return (
        <div className="card-grid">
          {hackathon.prizes.map((prize) => (
            <div key={prize.label} className="surface-card surface-card--soft">
              <p className="meta-text">{prize.label}</p>
              <h2>{prize.value}</h2>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "team") {
      const eligibleTeams = myTeams.filter(
        t => !t.hackathonId || String(t.hackathonId) === String(id)
      );

      const isTeamLeader = (team) =>
        String(team.leaderId) === String(currentUser?.userId) ||
        team.leader === currentUser?.nickname;

      const renderParticipantTable = (highlightMyTeam) => (
        <div className="participant-team-table">
          <div className="participant-team-table__head">
            <span>팀명</span>
            <span>팀장</span>
            <span>팀원 수</span>
            <span>상태</span>
          </div>
          {participantTeams.map((team) => {
            const isMyTeam = highlightMyTeam && String(team.id) === String(registrationStatus?.teamId);
            const clickable = !highlightMyTeam && team.isOpen;
            return (
              <div
                key={team.id}
                className={`participant-team-table__row${isMyTeam ? " participant-team-table__row--mine" : ""}${clickable ? " participant-team-table__row--clickable" : ""}`}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => handleOpenTeam(team.id) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpenTeam(team.id); } } : undefined}
              >
                <div className="participant-team-table__team">
                  <strong>{team.name}</strong>
                  {isMyTeam && <span className="team-role-badge">내 팀</span>}
                </div>
                <span>{team.leader}</span>
                <span>{team.currentMembers}명</span>
                <span className={`status-outline ${team.isOpen ? "status-outline--open" : "status-outline--closed"}`}>
                  {team.isOpen ? "모집 중" : "마감"}
                </span>
              </div>
            );
          })}
        </div>
      );

      return (
        <div className="stack-list team-tab-layout">
          {/* A: 팀 없음 */}
          {teamState === "A" && (
            <div className="team-state-card team-state-card--locked">
              <div className="team-state-card__icon"><Users size={36} strokeWidth={1.5} /></div>
              <h2 className="team-state-card__title">팀이 없어요</h2>
              <p className="team-state-card__description">
                팀을 만들거나 합류한 뒤 해커톤에 신청할 수 있어요.
              </p>
              <div className="team-state-actions">
                <button type="button" className="team-primary-button" onClick={() => openTeamCreateModal(true)}>
                  팀 만들기
                </button>
                <button type="button" className="team-secondary-button" onClick={() => navigate(`/camp?hackathon=${hackathon?.slug ?? ""}`)}>
                  팀 합류하기
                </button>
              </div>
            </div>
          )}

          {/* B: 모든 팀이 다른 해커톤에 참가 중 */}
          {teamState === "B" && (
            <section className="my-team-panel">
              <div className="team-state-warning">
                <span className="team-state-warning__icon"><AlertTriangle size={18} /></span>
                <div>
                  <p className="team-state-warning__title">참가 가능한 팀이 없어요.</p>
                  <p className="team-state-warning__desc">내 모든 팀이 이미 다른 해커톤에 참가 중이에요.</p>
                </div>
              </div>
              <div className="my-team-panel__section">
                <p className="my-team-panel__label">내 팀 목록</p>
                <div className="participant-team-table">
                  <div className="participant-team-table__head">
                    <span>팀명</span>
                    <span>참가 중인 해커톤</span>
                    <span>역할</span>
                  </div>
                  {myTeams.map((team) => (
                    <div key={team.id} className="participant-team-table__row">
                      <div className="participant-team-table__team"><strong>{team.name}</strong></div>
                      <span className="meta-text">{team.hackathonName ?? "-"}</span>
                      <span>
                        <span className={`team-role-badge${isTeamLeader(team) ? "" : " team-role-badge--member"}`}>
                          {isTeamLeader(team) ? "팀장" : "팀원"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="my-team-panel__actions">
                <button
                  type="button"
                  className="team-secondary-button"
                  onClick={() => openTeamCreateModal(true)}
                >
                  + 새 팀 만들어서 신청하기
                </button>
              </div>
            </section>
          )}

          {/* C-1: 신청 가능한 팀 있음 / 팀장인 팀 없음 */}
          {teamState === "C1" && (
            <section className="my-team-panel">
              <div className="team-state-warning team-state-warning--info">
                <span className="team-state-warning__icon"><Info size={18} /></span>
                <div>
                  <p className="team-state-warning__title">팀장이 신청해야 해커톤에 참가할 수 있어요.</p>
                  <p className="team-state-warning__desc">팀장에게 이 해커톤 신청을 요청해보세요.</p>
                </div>
              </div>
              <div className="my-team-panel__section">
                <p className="my-team-panel__label">내 팀 목록</p>
                <div className="participant-team-table">
                  <div className="participant-team-table__head">
                    <span>팀명</span>
                    <span>역할</span>
                    <span>상태</span>
                  </div>
                  {eligibleTeams.map((team) => (
                    <div key={team.id} className="participant-team-table__row">
                      <div className="participant-team-table__team"><strong>{team.name}</strong></div>
                      <span><span className="team-role-badge team-role-badge--member">팀원</span></span>
                      <span className="meta-text">미신청</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="my-team-panel__actions">
                <button
                  type="button"
                  className="team-secondary-button"
                  onClick={() => openTeamCreateModal(true)}
                >
                  + 새 팀 만들어서 신청하기
                </button>
              </div>
            </section>
          )}

          {/* C-2: 신청 가능한 팀 있음 / 팀장인 팀 있음 */}
          {teamState === "C2" && c2View === "choice" && (
            <div className="team-state-card">
              <div className="team-state-card__icon"><Trophy size={36} strokeWidth={1.5} /></div>
              <h2 className="team-state-card__title">어떻게 참가하시겠어요?</h2>
              <p className="team-state-card__description">
                기존 팀으로 바로 신청하거나, 새로운 팀을 만들어 참가할 수 있어요.
              </p>
              <div className="team-state-actions">
                <button
                  type="button"
                  className="team-primary-button"
                  onClick={() => setC2View("select")}
                >
                  기존 팀으로 참가
                </button>
                <button
                  type="button"
                  className="team-secondary-button"
                  onClick={() => openTeamCreateModal(false)}
                >
                  새로운 팀 생성
                </button>
              </div>
            </div>
          )}

          {teamState === "C2" && c2View === "select" && (
            <section className="my-team-panel">
              <div className="my-team-panel__header">
                <h2 className="my-team-panel__title">어떤 팀으로 신청할까요?</h2>
              </div>
              <div className="my-team-panel__section">
                <div className="team-select-list">
                  {myTeams.map((team) => {
                    const leader = isTeamLeader(team);
                    const elsewhere = team.hackathonId && String(team.hackathonId) !== String(id);
                    const selectable = leader && !elsewhere;
                    return (
                      <label
                        key={team.id}
                        className={`team-select-item${String(selectedTeamForRegistration) === String(team.id) ? " team-select-item--active" : ""}${!selectable ? " team-select-item--disabled" : ""}`}
                      >
                        <input
                          type="radio"
                          name="teamForRegistration"
                          value={team.id}
                          disabled={!selectable}
                          checked={String(selectedTeamForRegistration) === String(team.id)}
                          onChange={() => selectable && setSelectedTeamForRegistration(String(team.id))}
                        />
                        <div className="team-select-item__body">
                          <div className="team-select-item__title-row">
                            <strong>{team.name}</strong>
                            <span className={`team-role-badge${!leader ? " team-role-badge--member" : ""}`}>
                              {leader ? "팀장" : "팀원"}
                            </span>
                            {!selectable && (
                              <span className="meta-text">
                                {!leader ? "선택 불가 · 팀원" : `선택 불가 · ${team.hackathonName ?? "다른 해커톤"} 참가 중`}
                              </span>
                            )}
                          </div>
                          <p className="meta-text">팀원 {team.currentMembers}/{team.maxMembers}명</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="my-team-panel__actions my-team-panel__actions--spread">
                <button
                  type="button"
                  className="team-primary-button"
                  disabled={!selectedTeamForRegistration || registerHereLoading}
                  onClick={() => setRegisterConfirmOpen(true)}
                >
                  {registerHereLoading ? "신청 중..." : "이 팀으로 신청하기"}
                </button>
                <button
                  type="button"
                  className="button-link button-link--ghost"
                  onClick={() => setC2View("choice")}
                >
                  ← 돌아가기
                </button>
              </div>
              {registrationMessage && <p className="meta-text">{registrationMessage}</p>}
            </section>
          )}

          {/* D-1: 신청 완료 / 팀원 */}
          {teamState === "D1" && (
            <>
              <section className="my-team-panel">
                <div className="my-team-panel__header">
                  <div>
                    <h2 className="my-team-panel__title">
                      내 팀 · {myTeamDetail?.name ?? registrationStatus?.teamName ?? "로딩 중..."}
                    </h2>
                    <p className="my-team-panel__meta">팀원</p>
                  </div>
                  <div className="my-team-panel__badges">
                    <span className="status-outline status-outline--open">참가 중</span>
                  </div>
                </div>
                <div className="my-team-panel__section">
                  <ul className="my-team-members">
                    {(myTeamDetail?.members ?? []).map((member) => (
                      <li key={member.userId} className="my-team-member">
                        <span className={`my-team-member__dot${currentLeaderId === member.userId ? " my-team-member__dot--active" : ""}`} />
                        <strong>{member.nickname}</strong>
                        {currentLeaderId === member.userId && <span className="team-role-badge">팀장</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="my-team-panel__actions my-team-panel__actions--end">
                  <button type="button" className="team-danger-button" onClick={() => setLeaveTeamConfirmOpen(true)}>
                    팀 탈퇴
                  </button>
                </div>
              </section>

              <section className="detail-block">
                <h2 className="detail-block__title" style={{ marginBottom: "16px" }}>참가 팀 현황</h2>
                {renderParticipantTable(true)}
              </section>
            </>
          )}

          {/* D-2: 신청 완료 / 팀장 */}
          {teamState === "D2" && (
            <>
              <section className="my-team-panel">
                <div className="my-team-panel__header">
                  <div>
                    <h2 className="my-team-panel__title">
                      내 팀 · {myTeamDetail?.name ?? registrationStatus?.teamName ?? "로딩 중..."}
                    </h2>
                    <p className="my-team-panel__meta">팀장</p>
                  </div>
                  <div className="my-team-panel__badges">
                    <span className="status-outline status-outline--open">
                      {(myTeamDetail?.isOpen ?? true) ? "모집 중" : "마감"}
                    </span>
                    <span className="status-outline status-outline--open">참가 중</span>
                  </div>
                </div>
                <div className="my-team-panel__section">
                  <ul className="my-team-members">
                    {(myTeamDetail?.members ?? []).map((member) => (
                      <li key={member.userId} className="my-team-member">
                        <span className={`my-team-member__dot${currentLeaderId === member.userId ? " my-team-member__dot--active" : ""}`} />
                        <strong>{member.nickname}</strong>
                        {currentLeaderId === member.userId && <span className="team-role-badge">팀장</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="my-team-panel__actions my-team-panel__actions--spread">
                  <div className="my-team-panel__actions-left">
                    <button
                      type="button"
                      className="team-secondary-button team-secondary-button--muted"
                      onClick={() => { setTeamEditMessage(""); setIsEditTeamOpen(true); }}
                    >
                      팀 정보 수정
                    </button>
                    <button
                      type="button"
                      className={`team-secondary-button team-secondary-button--muted${applications.length === 0 ? " team-primary-button--disabled" : ""}`}
                      disabled={applications.length === 0}
                      onClick={() => setIsApplicationsOpen(true)}
                    >
                      신청 관리 ({applications.length})
                    </button>
                  </div>
                  <button
                    type="button"
                    className="team-danger-button"
                    onClick={() => setDeleteTeamConfirmOpen(true)}
                  >
                    팀 삭제
                  </button>
                </div>
              </section>

              <section className="detail-block">
                <h2 className="detail-block__title" style={{ marginBottom: "16px" }}>참가 팀 현황</h2>
                {renderParticipantTable(true)}
              </section>
            </>
          )}

          {/* A, B, C: 참가 팀 현황 테이블 */}
          {(teamState === "A" || teamState === "B" || teamState === "C1" || teamState === "C2") && (
            <section className="detail-block">
              <h2 className="detail-block__title" style={{ marginBottom: "16px" }}>참가 팀 현황</h2>
              {participantTeams.length === 0 ? (
                <div className="surface-card surface-card--soft">
                  <p className="meta-text">아직 공개된 참가 팀이 없습니다.</p>
                </div>
              ) : (
                renderParticipantTable(false)
              )}
            </section>
          )}
        </div>
      );
    }

    if (activeTab === "submit") {
      if (submitState === "open") {
        return (
          <div className="stack-list">
            <section className="detail-block">
              <h2 className="detail-block__title">제출</h2>

              <div className="submit-guide-card">
                <h3 className="submit-guide-card__title">제출 가이드</h3>
                <ul className="submit-guide-list">
                  <li>ZIP 또는 PDF 파일만 허용됩니다. (최대 50MB)</li>
                  <li>팀원 전원의 GitHub 아이디를 메모에 포함해주세요.</li>
                  <li>종료일 이후에는 제출이 불가합니다.</li>
                  <li>제출 후 수정은 1회까지 가능합니다.</li>
                </ul>
              </div>

              <div className="submit-form-card">
                <h3 className="submit-form-card__title">제출 폼</h3>
                <div className="stack-list">
                  <label className="form-field">
                    <span className="form-label">
                      메모 <span className="submit-required">*</span>
                    </span>
                    <textarea
                      className="form-control form-control--textarea submit-textarea"
                      placeholder="팀원 소개, 프로젝트 설명, 사용 기술 스택 등을 입력하세요."
                      value={submitMemo}
                      onChange={(e) => setSubmitMemo(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">
                      파일 첨부 <span className="submit-required">*</span>
                    </span>
                    <div className="submit-dropzone">
                      <p>
                        {submitFile
                          ? submitFile.name
                          : "ZIP, PDF 파일을 끌어다 놓거나"}
                      </p>
                      <label
                        className="submit-file-button"
                        style={{ cursor: "pointer" }}
                      >
                        파일 선택
                        <input
                          type="file"
                          accept=".zip,.pdf"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setSubmitFile(e.target.files[0] ?? null)
                          }
                        />
                      </label>
                      <span>최대 50MB · ZIP / PDF</span>
                    </div>
                  </label>

                  {submitMessage && (
                    <p
                      style={{
                        color: submitMessage.includes("실패") ? "red" : "green",
                      }}
                    >
                      {submitMessage}
                    </p>
                  )}

                  <div>
                    <button
                      type="button"
                      className="team-primary-button submit-button"
                      disabled={
                        isSubmitting || !submitFile || !submitMemo.trim()
                      }
                      onClick={async () => {
                        if (!submitFile || !submitMemo.trim()) return;
                        setIsSubmitting(true);
                        setSubmitMessage("");
                        try {
                          const formData = new FormData();
                          formData.append("file", submitFile);
                          formData.append("memo", submitMemo);
                          await submitResult(id, formData);
                          setSubmitMessage("제출이 완료되었습니다.");
                          setSubmitFile(null);
                          setSubmitMemo("");
                        } catch {
                          setSubmitMessage(
                            "제출에 실패했습니다. 다시 시도해주세요.",
                          );
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      {isSubmitting ? "제출 중..." : "제출하기"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      }

      if (submitState === "notRegistered") {
        return (
          <div className="team-state-card team-state-card--locked">
            <div className="team-state-card__icon"><Lock size={36} strokeWidth={1.5} /></div>
            <h2 className="team-state-card__title">해커톤에 먼저 참가해야 합니다</h2>
            <p className="team-state-card__description">
              제출하려면 먼저 이 해커톤에 참가 신청을 해주세요.
            </p>
          </div>
        );
      }

      if (submitState === "noTeam") {
        return (
          <div className="team-state-card team-state-card--ready">
            <div className="team-state-card__icon"><Handshake size={36} strokeWidth={1.5} /></div>
            <h2 className="team-state-card__title">팀을 먼저 구성해주세요</h2>
            <p className="team-state-card__description">
              팀 없이는 제출할 수 없어요. 팀 탭에서 팀을 생성하거나 기존 팀에 합류해주세요.
            </p>
          </div>
        );
      }

      return (
        <div className="team-state-card team-state-card--locked">
          <div className="team-state-card__icon"><Clock size={36} strokeWidth={1.5} /></div>
          <h2 className="team-state-card__title">제출이 마감되었습니다</h2>
          <p className="team-state-card__description">
            이 해커톤의 제출 기간이 종료되었습니다.
          </p>
        </div>
      );
    }

    if (activeTab === "leaderboard") {
      const isVoteType = hackathon.leaderboard.scoreType === "VOTE"
      return (
        <div className="surface-card">
          {hackathon.leaderboard.items.length === 0 ? (
            <p>아직 공개된 리더보드가 없습니다.</p>
          ) : (
            <div className="stack-list stack-list--compact">
              {hackathon.leaderboard.items.map((entry) => (
                <div
                  key={entry.teamName}
                  className="detail-list-row row-between"
                >
                  <strong>
                    #{entry.rank} {entry.teamName}
                  </strong>
                  {!isVoteType && (
                    <span className="meta-text">
                      {entry.submitted ? `${entry.score ?? "-"}` : "미제출"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="page-section">
      <div className="detail-header">
        <div className="tag-list">
          <span
            className={`status-outline status-outline--${hackathon.status}`}
          >
            {hackathon.statusLabel}
          </span>
          {hackathon.tags.map((tag) => (
            <span key={tag} className="tag-chip tag-chip--blue">
              {tag}
            </span>
          ))}
        </div>
        <div style={{ marginTop: "10px" }}>
          <h1>{hackathon.title}</h1>
        </div>
        <div className="detail-meta">
          <span>{hackathon.organizer}</span>
          <span>
            {hackathon.startDate} ~ {hackathon.endDate}
          </span>
          <span>참가자 {hackathon.participantCount}명</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack-list">
          <div
            className="detail-tabs"
            role="tablist"
            aria-label="해커톤 상세 탭"
          >
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`detail-tab${
                  activeTab === tab.key ? " detail-tab--active" : ""
                }`}
                onClick={() => changeActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="surface-card detail-panel">{renderTabContent()}</div>
        </div>

        <aside className="stack-list">
          <div className="sidebar-card">
            <h3>대회 정보</h3>
            <div className="info-row">
              <span>주최</span>
              <span>{hackathon.organizer}</span>
            </div>
            <div className="info-row">
              <span>시작일</span>
              <span>{hackathon.startDate}</span>
            </div>
            <div className="info-row">
              <span>종료일</span>
              <span>{hackathon.endDate}</span>
            </div>
            <div className="info-row">
              <span>참가자</span>
              <span>{hackathon.participantCount}명</span>
            </div>
            <div className="info-row">
              <span>상태</span>
              <span>
                {hackathon.status === "upcoming"
                  ? "진행 중"
                  : hackathon.statusLabel}
              </span>
            </div>
            {teamState === "A" && (
              <div className="team-state-actions team-state-actions--sidebar">
                <button
                  type="button"
                  className="detail-apply-button"
                  onClick={openParticipationEntry}
                >
                  신청하기
                </button>
              </div>
            )}
            {registrationMessage ? (
              <p className="meta-text">{registrationMessage}</p>
            ) : null}
          </div>

          <div className="sidebar-card">
            <h3>최고 상금</h3>
            <div className="detail-prize-card">
              <strong>{hackathon.prizes[0]?.value}</strong>
              <span>대상</span>
            </div>
          </div>
        </aside>
      </div>

      {isTeamNoticeOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsTeamNoticeOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-notice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="team-notice-title">팀 구성 유의사항</h2>
            <ul className="team-notice-list">
              <li>한 해커톤에 1개 팀만 참여할 수 있습니다.</li>
              <li>
                팀 생성 후 24시간 이내에 최소 2명 이상의 팀원이 필요합니다.
              </li>
              <li>팀 구성이 완료되면 팀원 변경이 제한될 수 있습니다.</li>
              <li>팀장만 제출 권한을 가집니다.</li>
            </ul>
            <p className="team-notice-copy">
              {teamNoticeMode === "existing"
                ? "위 사항을 확인하셨으면 기존 팀을 선택해 참가를 진행합니다."
                : "위 사항을 확인하셨으면 팀원 모집 페이지로 이동합니다."}
            </p>
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsTeamNoticeOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="team-primary-button"
                onClick={handleTeamNoticeConfirm}
              >
                {teamNoticeMode === "existing"
                  ? "확인, 기존 팀 선택하기"
                  : "확인, 팀원 모집 페이지로"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isParticipationModeOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsParticipationModeOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="participation-mode-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="participation-mode-title">참가 방식을 선택해주세요</h2>
            <p className="team-notice-copy team-notice-copy--compact">
              새로운 팀을 만들거나, 이미 내가 속한 기존 팀으로 이 해커톤에 참가할 수 있어요.
            </p>
            <div className="team-state-actions team-state-actions--modal">
              <button
                type="button"
                className="team-primary-button"
                onClick={() => openParticipationNotice("new")}
              >
                새로운 팀으로 참가
              </button>
              <button
                type="button"
                className="team-secondary-button"
                onClick={() => openParticipationNotice("existing")}
              >
                기존 팀으로 참가
              </button>
            </div>
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsParticipationModeOpen(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {isExistingTeamSelectOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsExistingTeamSelectOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existing-team-select-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="existing-team-select-title">기존 팀으로 참가</h2>
            {eligibleMyTeams.length === 0 ? (
              <>
                <p className="team-notice-copy team-notice-copy--compact">
                  현재 이 해커톤에 연결할 수 있는 내 팀이 없습니다.
                </p>
                <p className="team-notice-copy team-notice-copy--compact">
                  먼저 팀원 모집 페이지에서 새 팀을 생성한 뒤 다시 시도해주세요.
                </p>
              </>
            ) : (
              <div className="team-select-list">
                {eligibleMyTeams.map((team) => (
                  <label
                    key={team.id}
                    className={`team-select-item${
                      String(selectedExistingTeamId) === String(team.id)
                        ? " team-select-item--active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="existingTeam"
                      value={team.id}
                      checked={String(selectedExistingTeamId) === String(team.id)}
                      onChange={() => setSelectedExistingTeamId(String(team.id))}
                    />
                    <div className="team-select-item__body">
                      <div className="team-select-item__title-row">
                        <strong>{team.name}</strong>
                        <span className="team-role-badge">
                          {team.hackathonId ? "연결된 팀" : "독립 팀"}
                        </span>
                      </div>
                      <p className="meta-text">
                        팀장 {team.leader} · 팀원 {team.currentMembers}/{team.maxMembers}명
                      </p>
                      {team.hackathonName ? (
                        <p className="meta-text">
                          현재 해커톤: {team.hackathonName}
                        </p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            )}
            {existingTeamMessage ? (
              <p className="team-notice-copy team-notice-copy--compact team-notice-copy--error">
                {existingTeamMessage}
              </p>
            ) : null}
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsExistingTeamSelectOpen(false)}
              >
                닫기
              </button>
              <button
                type="button"
                className="team-primary-button"
                disabled={eligibleMyTeams.length === 0 || isRegisteringExistingTeam}
                onClick={handleExistingTeamRegister}
              >
                {isRegisteringExistingTeam ? "참가 처리 중..." : "선택한 팀으로 참가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isApplicationsOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsApplicationsOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-applications-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="team-applications-title">팀 합류 신청 관리</h2>
            <div className="team-applications-list">
              {applications.length === 0 ? (
                <p className="team-notice-copy">
                  현재 대기 중인 신청이 없습니다.
                </p>
              ) : (
                applications.map((application) => (
                  <div
                    key={application.applicationId}
                    className="team-application-item"
                  >
                    <div>
                      <strong>{application.nickname}</strong>
                      <p className="meta-text">
                        {application.position
                          ? `지원 역할: ${application.position} · `
                          : ""}
                        상태: {application.status} · 신청 ID:{" "}
                        {application.applicationId}
                      </p>
                    </div>
                    <div className="team-application-item__actions">
                      <button
                        type="button"
                        className="team-secondary-button team-secondary-button--muted"
                        onClick={async () => {
                          try {
                            await decideTeamApplication(
                              registrationStatus.teamId,
                              application.applicationId,
                              "REJECTED",
                            );
                            await refreshMyTeamState(registrationStatus.teamId);
                            await refreshParticipantTeams();
                            setApplicationMessage("신청을 거절했습니다.");
                          } catch {
                            setApplicationMessage("신청 거절에 실패했습니다.");
                          }
                        }}
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        className="team-primary-button team-primary-button--small"
                        onClick={async () => {
                          try {
                            await decideTeamApplication(
                              registrationStatus.teamId,
                              application.applicationId,
                              "ACCEPTED",
                            );
                            await refreshMyTeamState(registrationStatus.teamId);
                            await refreshParticipantTeams();
                            setApplicationMessage("신청을 수락했습니다.");
                          } catch {
                            setApplicationMessage("신청 수락에 실패했습니다.");
                          }
                        }}
                      >
                        수락
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {applicationMessage ? (
              <p className="team-notice-copy">{applicationMessage}</p>
            ) : null}
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsApplicationsOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditTeamOpen && myTeamDetail ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsEditTeamOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="team-edit-title">팀 정보 수정</h2>
            <div className="stack-list stack-list--compact">
              <label className="form-field">
                <span className="form-label">팀명</span>
                <input
                  className="form-control"
                  value={teamEditForm.name}
                  onChange={(event) =>
                    setTeamEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span className="form-label">팀 소개</span>
                <textarea
                  className="form-control form-control--textarea"
                  value={teamEditForm.description}
                  onChange={(event) =>
                    setTeamEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span className="form-label">모집 상태</span>
                <select
                  className="form-control"
                  value={String(teamEditForm.isOpen)}
                  onChange={(event) =>
                    setTeamEditForm((current) => ({
                      ...current,
                      isOpen: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">모집중</option>
                  <option value="false">마감</option>
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">최대 팀원 수</span>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={teamEditForm.maxMembers}
                  onChange={(event) =>
                    setTeamEditForm((current) => ({
                      ...current,
                      maxMembers: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="info-row">
                <span className="form-label">모집 역할</span>
                <button
                  type="button"
                  className="button-link button-link--ghost"
                  onClick={() =>
                    setTeamEditForm((current) => ({
                      ...current,
                      positions: [...current.positions, createEmptyPosition()],
                    }))
                  }
                >
                  역할 추가
                </button>
              </div>

              {teamEditForm.positions.map((position, index) => (
                <div
                  key={`detail-edit-position-${index}`}
                  className="form-grid"
                >
                  <label className="form-field">
                    <span className="form-label">역할명</span>
                    <input
                      className="form-control"
                      value={position.positionName}
                      onChange={(event) =>
                        setTeamEditForm((current) => ({
                          ...current,
                          positions: current.positions.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, positionName: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">인원</span>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      value={position.requiredCount}
                      onChange={(event) =>
                        setTeamEditForm((current) => ({
                          ...current,
                          positions: current.positions.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, requiredCount: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </label>

                  <div className="form-field">
                    <span className="form-label">관리</span>
                    <button
                      type="button"
                      className="button-link button-link--ghost"
                      onClick={() =>
                        setTeamEditForm((current) => ({
                          ...current,
                          positions:
                            current.positions.length === 1
                              ? [createEmptyPosition()]
                              : current.positions.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                        }))
                      }
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {teamEditMessage ? (
              <p className="team-notice-copy">{teamEditMessage}</p>
            ) : null}

            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsEditTeamOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="team-primary-button"
                onClick={async () => {
                  try {
                    setIsSavingTeam(true);
                    setTeamEditMessage("");

                    const updated = await updateTeam(myTeamDetail.id, {
                      name: teamEditForm.name,
                      description: teamEditForm.description,
                      isOpen: teamEditForm.isOpen,
                      maxMemberCount: Number(teamEditForm.maxMembers) || 1,
                      positions: teamEditForm.positions
                        .map((position) => ({
                          positionName: position.positionName.trim(),
                          requiredCount: Number(position.requiredCount) || 1,
                        }))
                        .filter((position) => position.positionName),
                    });

                    const refreshedDetail = await fetchTeamDetail(
                      myTeamDetail.id,
                    ).catch(() => ({
                      ...myTeamDetail,
                      ...updated,
                      description: teamEditForm.description,
                      isOpen: teamEditForm.isOpen,
                    }));

                    setMyTeamDetail(refreshedDetail);
                    await refreshParticipantTeams();
                    setTeamEditMessage("팀 정보가 수정되었습니다.");
                    setIsEditTeamOpen(false);
                  } catch {
                    setTeamEditMessage("팀 정보 수정에 실패했습니다.");
                  } finally {
                    setIsSavingTeam(false);
                  }
                }}
              >
                {isSavingTeam ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isTeamCreateModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsTeamCreateModalOpen(false)}>
          <div className="mypage-modal mypage-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mypage-modal__header">
              <div>
                <p className="eyebrow">new team</p>
                <h2>팀 만들기</h2>
                <p className="mypage-modal__subtitle">{hackathon?.title}</p>
              </div>
              <button type="button" className="mypage-modal__close" onClick={() => setIsTeamCreateModalOpen(false)}>✕</button>
            </div>

            <div className="mypage-modal__body mypage-modal__body--sections">
              <div className="surface-card">
                <p className="eyebrow">기본 정보</p>
                <div className="mypage-modal__form">
                  <label className="mypage-modal__label">
                    팀 이름 *
                    <input
                      className="mypage-modal__input"
                      placeholder="팀 이름을 입력하세요"
                      value={teamCreateForm.name}
                      onChange={(e) => setTeamCreateForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </label>
                  <label className="mypage-modal__label">
                    팀 소개
                    <textarea
                      className="mypage-modal__input mypage-modal__textarea"
                      placeholder="팀을 소개해주세요"
                      value={teamCreateForm.description}
                      onChange={(e) => setTeamCreateForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </label>
                  <label className="mypage-modal__label">
                    최대 팀원 수
                    <input
                      type="number" min="1" max="20"
                      className="mypage-modal__input"
                      value={teamCreateForm.maxMemberCount}
                      onChange={(e) => setTeamCreateForm((f) => ({ ...f, maxMemberCount: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="surface-card">
                <div className="mypage-modal__section-row">
                  <p className="eyebrow">모집 역할</p>
                  <button
                    type="button"
                    className="button-link button-link--ghost"
                    onClick={() => setTeamCreateForm((f) => ({ ...f, positions: [...f.positions, { positionName: "", requiredCount: "1" }] }))}
                  >
                    + 추가
                  </button>
                </div>
                <div className="mypage-modal__form">
                  {teamCreateForm.positions.map((pos, index) => (
                    <div key={index} className="mypage-modal__position-row">
                      <input
                        className="mypage-modal__input"
                        placeholder="역할명 (예: 프론트엔드)"
                        value={pos.positionName}
                        onChange={(e) => setTeamCreateForm((f) => ({
                          ...f,
                          positions: f.positions.map((p, i) => i === index ? { ...p, positionName: e.target.value } : p),
                        }))}
                      />
                      <input
                        type="number" min="1"
                        className="mypage-modal__input mypage-modal__input--count"
                        value={pos.requiredCount}
                        onChange={(e) => setTeamCreateForm((f) => ({
                          ...f,
                          positions: f.positions.map((p, i) => i === index ? { ...p, requiredCount: e.target.value } : p),
                        }))}
                      />
                      <button
                        type="button"
                        className="button-link button-link--ghost"
                        onClick={() => setTeamCreateForm((f) => ({
                          ...f,
                          positions: f.positions.length === 1
                            ? [{ positionName: "", requiredCount: "1" }]
                            : f.positions.filter((_, i) => i !== index),
                        }))}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {teamCreateError && <p className="mypage-modal__error">{teamCreateError}</p>}
            </div>

            <div className="mypage-modal__footer">
              <button type="button" className="team-secondary-button" onClick={() => setIsTeamCreateModalOpen(false)}>취소</button>
              <button
                type="button"
                className="team-primary-button"
                disabled={isCreatingTeam || !teamCreateForm.name.trim()}
                onClick={handleTeamCreate}
              >
                {isCreatingTeam ? "생성 중..." : "팀 만들기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {registerConfirmOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setRegisterConfirmOpen(false)}>
          <div className="team-notice-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>이 팀으로 신청할까요?</h2>
            <p className="team-notice-copy">
              <strong>{myTeams.find(t => String(t.id) === String(selectedTeamForRegistration))?.name ?? "선택한 팀"}</strong>으로{" "}
              {hackathon?.title}에 참가 신청합니다.
            </p>
            <div className="team-notice-actions">
              <button type="button" className="team-secondary-button team-secondary-button--muted" onClick={() => setRegisterConfirmOpen(false)}>
                취소
              </button>
              <button type="button" className="team-primary-button" disabled={registerHereLoading} onClick={handleRegisterHere}>
                {registerHereLoading ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {leaveTeamConfirmOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setLeaveTeamConfirmOpen(false)}>
          <div className="team-notice-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>팀을 탈퇴할까요?</h2>
            <p className="team-notice-copy">팀을 탈퇴하면 이 해커톤 참가도 취소돼요. 탈퇴하시겠어요?</p>
            <div className="team-notice-actions">
              <button type="button" className="team-secondary-button team-secondary-button--muted" onClick={() => setLeaveTeamConfirmOpen(false)}>
                아니요
              </button>
              <button type="button" className="team-danger-button" onClick={handleLeaveTeam}>
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTeamConfirmOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteTeamConfirmOpen(false)}>
          <div className="team-notice-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>팀을 삭제할까요?</h2>
            <p className="team-notice-copy">팀을 삭제하면 팀원 전체의 해커톤 참가가 취소돼요. 정말 삭제하시겠어요?</p>
            <div className="team-notice-actions">
              <button type="button" className="team-secondary-button team-secondary-button--muted" onClick={() => setDeleteTeamConfirmOpen(false)}>
                취소
              </button>
              <button type="button" className="team-danger-button" disabled={isDeletingTeam} onClick={handleDeleteTeam}>
                {isDeletingTeam ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTeam && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setSelectedTeam(null)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hackathon-team-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">team detail</p>
                <h2 id="hackathon-team-detail-title">{selectedTeam.name}</h2>
              </div>
              <button type="button" className="drawer-close-button" onClick={() => setSelectedTeam(null)}>
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <p>{selectedTeam.description || "팀 소개가 아직 없습니다."}</p>
                </div>
              </section>

              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <div className="info-row">
                    <span>팀장</span>
                    <span>{selectedTeam.leader}</span>
                  </div>
                  <div className="info-row">
                    <span>모집 상태</span>
                    <span>{selectedTeam.isOpen ? "모집 중" : "마감"}</span>
                  </div>
                  <div className="info-row">
                    <span>현재 인원</span>
                    <span>{selectedTeam.currentMembers} / {selectedTeam.maxMembers}명</span>
                  </div>
                </div>
              </section>

              {selectedTeam.positionDetails?.length > 0 && (
                <section className="surface-card">
                  <p className="meta-text">모집 포지션</p>
                  <div className="team-positions">
                    {selectedTeam.positionDetails.map((pos) => (
                      <span key={pos.positionName} className="tag-chip">
                        {pos.positionName} · {pos.requiredCount}명
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {selectedTeam.isOpen && (
                <section className="surface-card">
                  <label className="form-field">
                    <span className="form-label">지원할 역할</span>
                    <select
                      className="form-control"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                      <option value="">역할 선택 안 함</option>
                      {(selectedTeam.positionDetails ?? []).map((pos) => (
                        <option key={pos.positionName} value={pos.positionName}>
                          {pos.positionName} ({pos.requiredCount}명)
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              )}

              {selectedTeam.members?.length > 0 && (
                <section className="surface-card">
                  <p className="meta-text">팀원</p>
                  <div className="stack-list stack-list--compact">
                    {selectedTeam.members.map((m) => (
                      <div key={m.userId} className="info-row">
                        <span>{m.nickname}</span>
                        {m.position && <span className="tag-chip">{m.position}</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="team-create-drawer__footer">
              {teamDetailMessage && <p className="meta-text">{teamDetailMessage}</p>}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setSelectedTeam(null)}
              >
                닫기
              </button>
              <button
                type="button"
                className="team-primary-button"
                onClick={handleApply}
                disabled={!selectedTeam.isOpen || isApplying || appliedTeamIds.includes(selectedTeam.id)}
              >
                {appliedTeamIds.includes(selectedTeam.id)
                  ? "신청 완료"
                  : isApplying
                    ? "신청 중..."
                    : "합류 신청"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default HackathonDetailPage;
