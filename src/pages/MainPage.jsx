import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHackathons } from "../api/hackathons.js";
import { fetchPlatformStats } from "../api/stats.js";
import { getStoredUser } from "../lib/auth.js";

const typewriterWords = ["Build.", "Compete.", "Win."];
const cumulativeLengths = typewriterWords.reduce((accumulator, word, index) => {
  const previous = index === 0 ? 0 : accumulator[index - 1];
  accumulator.push(previous + word.length);
  return accumulator;
}, []);

function MainPage() {
  const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [brandTilt, setBrandTilt] = useState({ x: 0, y: 0 });
  const [visibleHackathons, setVisibleHackathons] = useState([]);
  const [stats, setStats] = useState({
    participants: 0,
    activeHackathons: 0,
    totalPrize: "-",
  });

  const renderedWords = useMemo(
    () =>
      typewriterWords.map((word, index) => {
        const previousLength = index === 0 ? 0 : cumulativeLengths[index - 1];
        const visibleLength = Math.max(
          0,
          Math.min(word.length, displayedLength - previousLength),
        );

        return word.slice(0, visibleLength);
      }),
    [displayedLength],
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && displayedLength < totalLength) {
          setDisplayedLength((value) => value + 1);
          return;
        }

        if (!isDeleting && displayedLength === totalLength) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && displayedLength > 0) {
          setDisplayedLength((value) => value - 1);
          return;
        }

        setDisplayedLength(0);
        setIsDeleting(false);
      },
      !isDeleting && displayedLength === totalLength
        ? 900
        : isDeleting
          ? 70
          : 110,
    );

    return () => window.clearTimeout(timeout);
  }, [displayedLength, isDeleting, totalLength]);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const currentUser = getStoredUser();
        const userTags = currentUser?.tags ?? [];

        let hackathonPromise;
        if (userTags.length > 0) {
          hackathonPromise = Promise.all(
            userTags
              .slice(0, 3)
              .map((tag) => fetchHackathons({ tag, limit: 3 })),
          ).then((results) => {
            const seen = new Set();
            return results
              .flat()
              .filter((h) => {
                if (seen.has(h.id)) return false;
                seen.add(h.id);
                return true;
              })
              .slice(0, 3);
          });
        } else {
          hackathonPromise = fetchHackathons({ limit: 3 });
        }

        const [hackathonList, statsResponse] = await Promise.all([
          hackathonPromise,
          fetchPlatformStats(),
        ]);

        if (!isMounted) return;

        setVisibleHackathons(hackathonList);
        setStats(statsResponse);
      } catch {
        if (!isMounted) return;
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleBannerMouseMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const ratioY = (event.clientY - bounds.top) / bounds.height - 0.5;

    setBrandTilt({
      x: ratioY * -8,
      y: ratioX * 10,
    });
  }

  function handleBannerMouseLeave() {
    setBrandTilt({ x: 0, y: 0 });
  }

  return (
    <section className="page-section">
      <div
        className="main-banner"
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={handleBannerMouseLeave}
      >
        <div className="main-banner__content">
          <div className="main-banner__left">
            <p className="banner-label">// HACKATHON PLATFORM v2.0</p>
            <h1 className="banner-title">
              <span>{renderedWords[0]}</span>
              <br />
              <span>{renderedWords[1]}</span>
              <br />
              <span className="banner-title__accent">
                {renderedWords[2]}
                <span className="banner-type-cursor">|</span>
              </span>
            </h1>
            <p className="banner-subtitle">
              팀을 만들고, 해커톤에 참가하고,
              <br />
              실력으로 랭킹을 올려보세요.
            </p>
            <div className="banner-actions">
              <Link
                to="/hackathons"
                className="banner-button banner-button--primary"
              >
                해커톤 둘러보기
              </Link>
              <Link to="/camp" className="banner-button banner-button--ghost">
                팀 찾기
              </Link>
            </div>
            <div className="banner-stats">
              <div>
                <strong>{stats.participants}+</strong>
                <span>참가자</span>
              </div>
              <div>
                <strong>{stats.activeHackathons}</strong>
                <span>진행 해커톤</span>
              </div>
              <div>
                <strong>{stats.totalPrize}</strong>
                <span>총 상금</span>
              </div>
            </div>
          </div>
          <div
            className="main-banner__brand"
            style={{
              "--brand-rotate-x": `${brandTilt.x}deg`,
              "--brand-rotate-y": `${brandTilt.y}deg`,
            }}
          >
            <div className="brand-wordmark__ambient" />
            <div className="brand-wordmark" aria-hidden="true">
              {["D", "A", "K", "E", "R"].map((letter, rowIndex) => (
                <span
                  key={`${letter}-${rowIndex}`}
                  className="brand-wordmark__row"
                  style={{ "--row-index": rowIndex }}
                >
                  <span
                    className="brand-wordmark__glyph brand-wordmark__glyph--deep"
                    style={{ "--layer-index": 0 }}
                  >
                    {letter}
                  </span>
                  <span
                    className="brand-wordmark__glyph brand-wordmark__glyph--mid"
                    style={{ "--layer-index": 1 }}
                  >
                    {letter}
                  </span>
                  <span
                    className="brand-wordmark__glyph brand-wordmark__glyph--face"
                    style={{ "--layer-index": 2 }}
                  >
                    {letter}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="main-hero">
        <div className="page-header page-header--center">
          <h1>
            개발자들의 무대,
            <span className="headline-accent"> 지금 시작하세요</span>
          </h1>
          <p className="page-description">
            해커톤 참가, 팀원 모집, 성과 랭킹까지 한 곳에서.
          </p>
        </div>

        <div className="hero-editorial">
          <Link to="/hackathons" className="hero-editorial__feature">
            <span className="hero-editorial__status">LIVE</span>
            <span className="hero-editorial__index">01</span>
            <span className="hero-editorial__label">EXPLORE HACKATHONS</span>
            <h2>진행 중인 해커톤을 빠르게 탐색하세요</h2>
            <p>
              현재 모집 중이거나 곧 시작될 해커톤을 확인하고 바로 참가해보세요.
            </p>
            <div className="hero-editorial__meta">
              <span>{visibleHackathons.length || 4}개의 활성 해커톤</span>
              <span>상세 일정 확인 가능</span>
              <span>AI/ML 인기</span>
            </div>
            <span className="hero-editorial__cta">해커톤 목록 열기 →</span>
            <span className="hero-editorial__watermark">01</span>
          </Link>

          <div className="hero-editorial__stack">
            <Link to="/camp" className="hero-editorial__card">
              <span className="hero-editorial__status hero-editorial__status--soft">
                HOT
              </span>
              <span className="hero-editorial__index">02</span>
              <span className="hero-editorial__label">FIND YOUR TEAM</span>
              <h2>자신만의 팀을 결성하세요</h2>
              <p>
                모집 중인 팀을 둘러보거나 직접 팀을 만들어 팀원을 모집할 수
                있습니다.
              </p>
              <div className="hero-editorial__mini-meta">
                <span>신규 팀 모집</span>
                <span>포지션 탐색</span>
              </div>
              <span className="hero-editorial__cta">팀 모집 둘러보기 →</span>
              <span className="hero-editorial__watermark hero-editorial__watermark--small">
                02
              </span>
            </Link>

            <Link to="/rankings" className="hero-editorial__card">
              <span className="hero-editorial__status hero-editorial__status--soft">
                WEEKLY
              </span>
              <span className="hero-editorial__index">03</span>
              <span className="hero-editorial__label">CHECK THE BOARD</span>
              <h2>랭킹 흐름을 보고 다음 전략을 세우세요</h2>
              <p>내 위치와 상위권 흐름을 확인하고 다음 목표를 잡아보세요.</p>
              <div className="hero-editorial__mini-meta">
                <span>Top 10 업데이트</span>
                <span>순위 변동 확인</span>
              </div>
              <span className="hero-editorial__cta">전체 랭킹 확인 →</span>
              <span className="hero-editorial__watermark hero-editorial__watermark--small">
                03
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-head">
          <h2>지금 모집 중인 해커톤</h2>
        </div>
        <div className="stack-list">
          {visibleHackathons.map((hackathon) => (
            <Link
              key={hackathon.id ?? hackathon.slug}
              to={`/hackathons/${hackathon.id ?? hackathon.slug}`}
              className="surface-card surface-card--link hackathon-card"
            >
              <div className="row-between row-between--start">
                <div className="stack-list stack-list--compact">
                  <div className="row-between row-between--wrap">
                    <h2>
                      {hackathon.title}&nbsp;&nbsp;&nbsp;
                      <span
                        className={`status-pill status-pill--${hackathon.status}`}
                      >
                        {hackathon.statusLabel}
                      </span>
                    </h2>
                  </div>
                  {hackathon.tags.length > 0 && (
                    <div className="hackathon-card__tags">
                      {hackathon.tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag-chip tag-chip--blue"
                          style={{ marginRight: "5px" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p>{hackathon.summary}</p>
                </div>
                <div className="hackathon-card__meta">
                  <span>
                    {hackathon.startDate} ~ {hackathon.endDate}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

export default MainPage;
