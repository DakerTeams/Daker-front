import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  cancelRegistration,
  fetchHackathonDetail,
  fetchHackathonLeaderboard,
  fetchHackathonTeams,
  fetchRegistrationStatus,
} from "../api/hackathons.js";
import {
  decideTeamApplication,
  deleteTeam,
  fetchMyTeams,
  fetchTeamApplications,
  fetchTeamDetail,
  updateTeam,
} from "../api/teams.js";
import { getStoredUser } from "../lib/auth.js";
import { hackathons } from "../mock/hackathons.js";
import { teams } from "../mock/teams.js";

const detailTabs = [
  { key: "overview", label: "개요" },
  { key: "schedule", label: "일정" },
  { key: "prize", label: "상금" },
  { key: "team", label: "팀" },
  { key: "submit", label: "제출" },
  { key: "leaderboard", label: "리더보드" },
];

function HackathonDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [teamState, setTeamState] = useState("notRegistered");
  const [submitState, setSubmitState] = useState("notRegistered");
  const [isTeamNoticeOpen, setIsTeamNoticeOpen] = useState(false);
  const [remoteHackathon, setRemoteHackathon] = useState(null);
  const [remoteTeams, setRemoteTeams] = useState(null);
  const [remoteLeaderboard, setRemoteLeaderboard] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [isRegisteringTeam, setIsRegisteringTeam] = useState(false);
  const [myTeamDetail, setMyTeamDetail] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teamEditForm, setTeamEditForm] = useState({
    name: "",
    description: "",
    isOpen: true,
  });
  const [teamEditMessage, setTeamEditMessage] = useState("");
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const currentUser = getStoredUser();

  const mockHackathon = useMemo(
    () => hackathons.find((item) => String(item.id) === String(id)),
    [id],
  );

  const mockParticipantTeams = useMemo(
    () => teams.filter((team) => String(team.hackathonId) === String(id)),
    [id],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const [detail, participantTeams, leaderboard] = await Promise.all([
          fetchHackathonDetail(id),
          fetchHackathonTeams(id),
          fetchHackathonLeaderboard(id),
        ]);

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
          const [status, myTeams] = await Promise.all([
            fetchRegistrationStatus(id),
            fetchMyTeams(),
          ]);

          if (!isMounted) return;

          setRegistrationStatus(status);
          setTeamState(status?.teamId ? "hasTeam" : "notRegistered");

          const matchedTeam = myTeams.find(
            (team) => String(team.id) === String(status?.teamId),
          );
          if (matchedTeam) {
            try {
              const [detail, applicationRows] = await Promise.all([
                fetchTeamDetail(matchedTeam.id),
                fetchTeamApplications(matchedTeam.id),
              ]);

              if (!isMounted) return;
              setMyTeamDetail(detail);
              setApplications(applicationRows);
            } catch {
              if (!isMounted) return;
              setMyTeamDetail(matchedTeam);
              setApplications([]);
            }

            setRemoteTeams((current) => {
              const others = (current ?? participantTeams ?? []).filter(
                (team) => String(team.id) !== String(matchedTeam.id),
              );
              return [matchedTeam, ...others];
            });
          }
        } catch {
          if (!isMounted) return;
          setRegistrationStatus(null);
          setTeamState("notRegistered");
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const hackathon = useMemo(() => {
    if (!mockHackathon && !remoteHackathon) {
      return null;
    }

    return {
      ...(mockHackathon ?? {}),
      ...(remoteHackathon ?? {}),
      schedules: mockHackathon?.schedules ?? remoteHackathon?.schedules ?? [],
      evaluations:
        mockHackathon?.evaluations ?? remoteHackathon?.evaluations ?? [],
      prizes: mockHackathon?.prizes ?? remoteHackathon?.prizes ?? [],
      teamStates:
        mockHackathon?.teamStates ?? remoteHackathon?.teamStates ?? {},
      submitStates:
        mockHackathon?.submitStates ?? remoteHackathon?.submitStates ?? {},
      leaderboard:
        remoteLeaderboard && remoteLeaderboard.length > 0
          ? remoteLeaderboard
          : (mockHackathon?.leaderboard ?? []),
    };
  }, [mockHackathon, remoteHackathon, remoteLeaderboard]);

  const participantTeams = useMemo(
    () =>
      remoteTeams && remoteTeams.length > 0
        ? remoteTeams
        : mockParticipantTeams,
    [mockParticipantTeams, remoteTeams],
  );

  const currentLeaderId = myTeamDetail?.leaderId ?? null;
  const currentLeaderName =
    myTeamDetail?.leader ?? registrationStatus?.teamName ?? "";
  const isCurrentUserLeader =
    Boolean(currentUser?.userId) &&
    ((currentLeaderId && currentLeaderId === currentUser.userId) ||
      (currentUser?.nickname && currentLeaderName === currentUser.nickname));

  useEffect(() => {
    if (!myTeamDetail) return;

    setTeamEditForm({
      name: myTeamDetail.name ?? "",
      description: myTeamDetail.description ?? "",
      isOpen: myTeamDetail.isOpen ?? true,
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
      return (
        <div className="detail-section__content">
          <section className="detail-block">
            <h2 className="detail-block__title">대회 개요</h2>
            <p className="detail-description">{hackathon.overview}</p>
          </section>

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
      return (
        <div className="stack-list team-tab-layout">
          <div className="team-state-switcher" aria-label="팀 상태 미리보기">
            <span className="team-state-switcher__label">데모 상태 :</span>
            <div className="filter-group">
              <button
                type="button"
                className={`filter-chip${
                  teamState === "notRegistered" ? " filter-chip--active" : ""
                }`}
                onClick={() => setTeamState("notRegistered")}
              >
                미참가
              </button>
              <button
                type="button"
                className={`filter-chip${
                  teamState === "noTeam" ? " filter-chip--active" : ""
                }`}
                onClick={() => setTeamState("noTeam")}
              >
                참가 완료 · 팀 없음
              </button>
              <button
                type="button"
                className={`filter-chip${
                  teamState === "hasTeam" ? " filter-chip--active" : ""
                }`}
                onClick={() => setTeamState("hasTeam")}
              >
                팀 있음
              </button>
            </div>
          </div>

          {teamState === "notRegistered" && (
            <div className="team-state-card team-state-card--locked">
              <div className="team-state-card__icon">🔒</div>
              <h2 className="team-state-card__title">
                해커톤에 먼저 신청해야 합니다
              </h2>
              <p className="team-state-card__description">
                팀을 구성하려면 먼저 이 해커톤에 참가 신청을 해야 해요.
              </p>
              <p className="team-state-card__description">
                신청 후 팀을 생성하거나 기존 팀에 합류할 수 있어요.
              </p>
              <button
                type="button"
                className="team-primary-button"
                onClick={() => setIsTeamNoticeOpen(true)}
              >
                팀 만들고 참가하기
              </button>
            </div>
          )}

          {teamState === "noTeam" && (
            <div className="team-state-card team-state-card--ready">
              <div className="team-state-card__icon">🤝</div>
              <h2 className="team-state-card__title">
                참가 신청 완료! 이제 팀을 만들어보세요
              </h2>
              <p className="team-state-card__description">
                팀 없이는 제출할 수 없어요. 1인 팀도 가능하니 먼저 팀을 생성해
                주세요.
              </p>
              <p className="team-state-card__description">
                팀원 모집 페이지에서 다른 팀에 합류할 수도 있어요.
              </p>
              <div className="team-state-actions">
                <button
                  type="button"
                  className="team-primary-button"
                  onClick={() => setIsTeamNoticeOpen(true)}
                >
                  + 팀 생성하기
                </button>
                <Link to="/camp" className="team-secondary-button">
                  기존 팀 찾기 →
                </Link>
              </div>
            </div>
          )}

          {teamState === "hasTeam" && (
            <>
              <section className="my-team-panel">
                <div className="my-team-panel__header">
                  <div>
                    <h2 className="my-team-panel__title">
                      {myTeamDetail?.name ??
                        registrationStatus?.teamName ??
                        participantTeams[0]?.name ??
                        "내 팀"}
                    </h2>
                    <p className="my-team-panel__meta">
                      내 팀 · {isCurrentUserLeader ? "팀장" : "팀원"}
                    </p>
                  </div>
                  <div className="my-team-panel__badges">
                    <span className="status-outline status-outline--open">
                      {(myTeamDetail?.isOpen ?? true) ? "모집 중" : "마감"}
                    </span>
                    {isCurrentUserLeader ? (
                      <button
                        type="button"
                        className="team-primary-button team-primary-button--small"
                        onClick={() => setIsApplicationsOpen(true)}
                      >
                        신청 관리 ({applications.length})
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="my-team-panel__section">
                  <p className="my-team-panel__label">
                    팀원{" "}
                    {myTeamDetail?.members?.length ??
                      participantTeams[0]?.currentMembers ??
                      0}
                    명
                  </p>
                  <ul className="my-team-members">
                    {(myTeamDetail?.members ?? []).map((member) => (
                      <li key={member.userId} className="my-team-member">
                        <span
                          className={`my-team-member__dot${
                            currentLeaderId === member.userId
                              ? " my-team-member__dot--active"
                              : ""
                          }`}
                        />
                        <strong>{member.nickname}</strong>
                        {currentLeaderId === member.userId ? (
                          <span className="team-role-badge">팀장</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="my-team-panel__actions">
                  {isCurrentUserLeader ? (
                    <button
                      type="button"
                      className="team-secondary-button team-secondary-button--muted"
                      onClick={() => {
                        setTeamEditMessage("");
                        setIsEditTeamOpen(true);
                      }}
                    >
                      팀 정보 수정
                    </button>
                  ) : null}
                  {isCurrentUserLeader ? (
                    <button
                      type="button"
                      className="team-danger-button"
                      onClick={async () => {
                        if (!myTeamDetail?.id) return;
                        try {
                          setIsDeletingTeam(true);
                          await deleteTeam(myTeamDetail.id);
                          setMyTeamDetail(null);
                          setApplications([]);
                          setRegistrationStatus(null);
                          setTeamState("notRegistered");
                          await refreshParticipantTeams();
                          setRegistrationMessage("팀이 삭제되었습니다.");
                        } catch {
                          setRegistrationMessage("팀 삭제에 실패했습니다.");
                        } finally {
                          setIsDeletingTeam(false);
                        }
                      }}
                    >
                      {isDeletingTeam ? "삭제 중..." : "팀 삭제"}
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="detail-block">
                <h2 className="detail-block__title">참가 팀 현황</h2>
                <div className="participant-team-table">
                  <div className="participant-team-table__head">
                    <span>팀명</span>
                    <span>팀장</span>
                    <span>팀원 수</span>
                    <span>상태</span>
                  </div>
                  {participantTeams.map((team) => (
                    <div key={team.id} className="participant-team-table__row">
                      <div className="participant-team-table__team">
                        <strong>{team.name}</strong>
                        {String(team.id) ===
                          String(registrationStatus?.teamId) && (
                          <span className="team-role-badge">내 팀</span>
                        )}
                      </div>
                      <span>{team.leader}</span>
                      <span>{team.currentMembers}명</span>
                      <span
                        className={`status-outline ${
                          team.isOpen
                            ? "status-outline--open"
                            : "status-outline--closed"
                        }`}
                      >
                        {team.isOpen ? "모집 중" : "마감"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="detail-block">
            <h2 className="detail-block__title">참가 팀 현황</h2>
            {participantTeams.length === 0 ? (
              <div className="surface-card surface-card--soft">
                <p className="meta-text">아직 공개된 참가 팀이 없습니다.</p>
              </div>
            ) : (
              <div className="participant-team-table">
                <div className="participant-team-table__head">
                  <span>팀명</span>
                  <span>팀장</span>
                  <span>팀원 수</span>
                  <span>상태</span>
                </div>
                {participantTeams.map((team) => (
                  <div key={team.id} className="participant-team-table__row">
                    <div className="participant-team-table__team">
                      <strong>{team.name}</strong>
                      {String(team.id) === String(registrationStatus?.teamId) && (
                        <span className="team-role-badge">내 팀</span>
                      )}
                    </div>
                    <span>{team.leader}</span>
                    <span>{team.currentMembers}명</span>
                    <span
                      className={`status-outline ${
                        team.isOpen
                          ? 'status-outline--open'
                          : 'status-outline--closed'
                      }`}
                    >
                      {team.isOpen ? '모집 중' : '마감'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
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
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">
                      파일 첨부 <span className="submit-required">*</span>
                    </span>
                    <div className="submit-dropzone">
                      <p>ZIP, PDF, CSV 파일을 끌어다 놓거나</p>
                      <button type="button" className="submit-file-button">
                        파일 선택
                      </button>
                      <span>최대 50MB · ZIP / PDF / CSV</span>
                    </div>
                  </label>

                  <div>
                    <button
                      type="button"
                      className="team-primary-button submit-button"
                    >
                      제출하기
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      }

      return (
        <div className="stack-list">
          <div className="surface-card surface-card--soft">
            <div className="filter-group" aria-label="제출 상태 미리보기">
              <button
                type="button"
                className={`filter-chip${
                  submitState === "notRegistered" ? " filter-chip--active" : ""
                }`}
                onClick={() => setSubmitState("notRegistered")}
              >
                미참가
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === "noTeam" ? " filter-chip--active" : ""
                }`}
                onClick={() => setSubmitState("noTeam")}
              >
                팀 없음
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === "open" ? " filter-chip--active" : ""
                }`}
                onClick={() => setSubmitState("open")}
              >
                제출 가능
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === "closed" ? " filter-chip--active" : ""
                }`}
                onClick={() => setSubmitState("closed")}
              >
                제출 마감
              </button>
            </div>
          </div>

          <div className="surface-card">
            <p className="meta-text">제출 탭 상태</p>
            <h2>{hackathon.submitStates[submitState]}</h2>
            <div className="surface-card surface-card--soft">
              <p className="meta-text">제출 폼 필드</p>
              <ul className="bullet-list">
                <li>제출 제목</li>
                <li>한 줄 요약</li>
                <li>규칙별 URL / PDF / ZIP 첨부</li>
                <li>팀 소개 및 메모</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "leaderboard") {
      return (
        <div className="surface-card">
          {hackathon.leaderboard.length === 0 ? (
            <p>아직 공개된 리더보드가 없습니다.</p>
          ) : (
            <div className="stack-list stack-list--compact">
              {hackathon.leaderboard.map((entry) => (
                <div
                  key={entry.teamName}
                  className="detail-list-row row-between"
                >
                  <strong>
                    #{entry.rank} {entry.teamName}
                  </strong>
                  <span className="meta-text">
                    {entry.submitted ? `${entry.score}점` : "미제출"}
                  </span>
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
            {hackathon.status === "upcoming"
              ? "진행 중"
              : hackathon.statusLabel}
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
                onClick={() => setActiveTab(tab.key)}
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
            {teamState === "hasTeam" ? (
              <button
                type="button"
                className="detail-apply-button detail-apply-button--secondary"
                onClick={async () => {
                  try {
                    await cancelRegistration(id);
                    setRegistrationStatus(null);
                    setTeamState("notRegistered");
                    setRegistrationMessage("참가가 취소되었습니다.");
                  } catch {
                    setRegistrationMessage("참가 취소에 실패했습니다.");
                  }
                }}
              >
                참가 취소
              </button>
            ) : (
              <button
                type="button"
                className="detail-apply-button"
                onClick={() => setIsTeamNoticeOpen(true)}
              >
                팀 만들고 참가하기
              </button>
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
              위 사항을 확인하셨으면 팀 생성 페이지로 이동합니다.
            </p>
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsTeamNoticeOpen(false)}
              >
                취소
              </button>
              <Link
                to="/team-create"
                className="team-primary-button"
                onClick={() => setIsTeamNoticeOpen(false)}
              >
                확인, 팀 생성 페이지로
              </Link>
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
    </section>
  );
}

export default HackathonDetailPage;
